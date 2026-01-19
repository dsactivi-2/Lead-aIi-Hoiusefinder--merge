"""
Main application orchestrator
Coordinates all modules to find accommodation
"""
import logging
from datetime import datetime, timedelta
from typing import List
import schedule
import time

from .models import Employee, Listing
from .config import settings
from .utils import setup_logger, RegionCalculator
from .sheets import EmployeeSheetReader, ResultsSheetWriter
from .scrapers import (
    MonteurzimmerScraper,
    BookingScraper,
    AirbnbScraper,
    WGGesuchtScraper,
    EbayKleinanzeigenScraper
)
from .filters import ListingFilter
from .communication import EmailSender, WhatsAppSender
from .ai import ResponseAnalyzer, RecommendationEngine

logger = setup_logger(__name__)


class HousefinderApp:
    """Main application class"""
    
    def __init__(self):
        """Initialize all components"""
        logger.info("Initializing Housefinder application")
        
        # Initialize components
        self.sheet_reader = EmployeeSheetReader()
        self.sheet_writer = ResultsSheetWriter()
        self.region_calculator = RegionCalculator()
        self.listing_filter = ListingFilter()
        self.email_sender = EmailSender()
        self.whatsapp_sender = WhatsAppSender()
        self.response_analyzer = ResponseAnalyzer()
        self.recommendation_engine = RecommendationEngine()
        
        # Initialize scrapers
        self.scrapers = [
            MonteurzimmerScraper(),
            BookingScraper(),
            AirbnbScraper(),
            WGGesuchtScraper(),
            EbayKleinanzeigenScraper(),
        ]
        
        logger.info("Application initialized")
    
    def setup_sheets(self):
        """Setup Google Sheets (run once at start)"""
        logger.info("Setting up Google Sheets")
        
        try:
            # Create Mitarbeiter sheet template
            self.sheet_reader.create_mitarbeiter_sheet_template()
            
            # Create Ergebnisse sheet
            self.sheet_writer.create_results_sheet()
            
            logger.info("Google Sheets setup complete")
            
        except Exception as e:
            logger.error(f"Error setting up sheets: {e}")
    
    def process_employee(self, employee: Employee) -> None:
        """
        Process accommodation search for one employee
        
        Steps:
        1. Calculate search region
        2. Scrape all platforms
        3. Filter and validate listings
        4. Send emails and WhatsApp messages
        5. Schedule follow-ups
        
        Args:
            employee: Employee requiring accommodation
        """
        logger.info(f"Processing employee: {employee.name}")
        
        # Step 0.1: Calculate search region
        region = self.region_calculator.get_search_region(
            employee.zip_code,
            employee.city,
            employee.state
        )
        
        logger.info(f"Search region: {region['center_city']}, radius: {region['max_radius_km']}km")
        
        # Step 1: Scrape all platforms
        all_listings = []
        for scraper in self.scrapers:
            try:
                listings = scraper.scrape(employee.city, employee.zip_code)
                all_listings.extend(listings)
                logger.info(f"Scraped {len(listings)} from {scraper.platform_name}")
            except Exception as e:
                logger.error(f"Error scraping {scraper.platform_name}: {e}")
        
        logger.info(f"Total listings scraped: {len(all_listings)}")
        
        # Step 2: Filter and validate
        # Remove duplicates
        unique_listings = self.listing_filter.remove_duplicates(all_listings)
        
        # Filter by criteria
        valid_listings = self.listing_filter.filter_listings(
            unique_listings,
            employee,
            region['center_coordinates']
        )
        
        logger.info(f"Valid listings after filtering: {len(valid_listings)}")
        
        if not valid_listings:
            logger.warning(f"No valid listings found for {employee.name}")
            return
        
        # Step 3 & 4: Send communications
        # Email outreach
        email_results = self.email_sender.send_batch_inquiries(employee, valid_listings)
        logger.info(f"Email results: {email_results}")
        
        # WhatsApp outreach (immediate for urgent, after email for normal)
        if employee.urgent:
            # Send WhatsApp immediately for urgent cases
            whatsapp_results = self.whatsapp_sender.send_batch_inquiries(employee, valid_listings)
            logger.info(f"WhatsApp results (urgent): {whatsapp_results}")
        else:
            # For normal cases, could wait or send after delay
            whatsapp_results = self.whatsapp_sender.send_batch_inquiries(employee, valid_listings)
            logger.info(f"WhatsApp results: {whatsapp_results}")
        
        # Schedule follow-ups
        self._schedule_followups(employee, valid_listings)
        
        logger.info(f"Completed processing for {employee.name}")
    
    def process_all_employees(self) -> None:
        """Process accommodation search for all employees"""
        logger.info("Starting batch processing for all employees")
        
        try:
            # Read employees from sheet
            employees = self.sheet_reader.get_employees()
            
            if not employees:
                logger.warning("No employees found in sheet")
                return
            
            logger.info(f"Found {len(employees)} employees to process")
            
            # Process each employee
            for employee in employees:
                try:
                    self.process_employee(employee)
                except Exception as e:
                    logger.error(f"Error processing {employee.name}: {e}")
            
            logger.info("Batch processing complete")
            
        except Exception as e:
            logger.error(f"Error in batch processing: {e}")
    
    def _schedule_followups(self, employee: Employee, listings: List[Listing]) -> None:
        """
        Schedule follow-up messages
        
        Args:
            employee: Employee
            listings: List of contacted listings
        """
        # Determine follow-up interval based on urgency
        followup_hours = (
            settings.URGENT_FOLLOWUP_HOURS 
            if employee.urgent 
            else settings.NORMAL_FOLLOWUP_HOURS
        )
        
        # In production, this would use a proper job scheduler (Celery, APScheduler, etc.)
        logger.info(f"Follow-ups scheduled in {followup_hours} hours for {employee.name}")
        
        # TODO: Implement actual scheduling with job queue
        # For now, this is a placeholder
    
    def run_scheduled(self) -> None:
        """Run the application on a schedule"""
        logger.info("Starting scheduled mode")
        
        # Setup sheets first time
        self.setup_sheets()
        
        # Schedule scraping jobs
        # Urgent employees: every 2 hours
        # Normal employees: every 24 hours
        
        schedule.every(2).hours.do(self._process_urgent_employees)
        schedule.every(24).hours.do(self._process_normal_employees)
        
        # Run immediately on start
        self.process_all_employees()
        
        # Keep running
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def _process_urgent_employees(self) -> None:
        """Process only urgent employees"""
        logger.info("Processing urgent employees")
        
        try:
            employees = self.sheet_reader.get_employees()
            urgent = [e for e in employees if e.urgent]
            
            logger.info(f"Found {len(urgent)} urgent employees")
            
            for employee in urgent:
                self.process_employee(employee)
                
        except Exception as e:
            logger.error(f"Error processing urgent employees: {e}")
    
    def _process_normal_employees(self) -> None:
        """Process only normal (non-urgent) employees"""
        logger.info("Processing normal employees")
        
        try:
            employees = self.sheet_reader.get_employees()
            normal = [e for e in employees if not e.urgent]
            
            logger.info(f"Found {len(normal)} normal employees")
            
            for employee in normal:
                self.process_employee(employee)
                
        except Exception as e:
            logger.error(f"Error processing normal employees: {e}")


def main():
    """Main entry point"""
    app = HousefinderApp()
    
    # Run in scheduled mode
    # For one-time run, use: app.process_all_employees()
    app.run_scheduled()


if __name__ == "__main__":
    main()
