"""
Booking.com scraper for long-term stays
"""
import logging
from typing import List
from .base_scraper import BaseScraper
from ..models import Listing

logger = logging.getLogger(__name__)


class BookingScraper(BaseScraper):
    """Scraper for Booking.com long-term stays"""
    
    BASE_URL = "https://www.booking.com"
    
    def __init__(self):
        super().__init__("Booking.com")
    
    def scrape(self, city: str, zip_code: str = None, **kwargs) -> List[Listing]:
        """
        Scrape Booking.com for long-term accommodation
        
        Args:
            city: City name to search
            zip_code: Optional ZIP code
            **kwargs: Additional parameters (e.g., checkin, checkout dates)
            
        Returns:
            List of Listing objects
        """
        logger.info(f"Scraping {self.platform_name} for {city}")
        
        listings = []
        
        # Booking.com requires dates for search
        # For long-term, use extended period
        search_url = f"{self.BASE_URL}/searchresults.html"
        params = {
            'ss': city,
            'nflt': 'ht_id%3D201',  # Apartments filter
        }
        
        try:
            # Note: Booking.com has strong anti-scraping measures
            # Consider using their API or a specialized scraping service
            logger.warning(f"{self.platform_name} scraping requires special handling (anti-bot measures)")
            
            soup = self.get_page(search_url, params)
            if not soup:
                return listings
            
            # Parse listings
            # Note: Selectors are templates and need verification
            listing_elements = soup.select('[data-testid="property-card"]')
            
            for element in listing_elements:
                try:
                    listing = self._parse_listing(element)
                    if listing:
                        listings.append(listing)
                except Exception as e:
                    logger.error(f"Error parsing listing: {e}")
                    continue
            
            logger.info(f"Found {len(listings)} listings on {self.platform_name}")
            
        except Exception as e:
            logger.error(f"Error scraping {self.platform_name}: {e}")
        
        return listings
    
    def _parse_listing(self, element) -> Listing:
        """Parse individual listing element"""
        try:
            title_elem = element.select_one('[data-testid="title"]')
            title = self.clean_text(title_elem.text) if title_elem else ""
            
            url_elem = element.select_one('a')
            url = self.BASE_URL + url_elem['href'] if url_elem and url_elem.get('href') else ""
            
            location_elem = element.select_one('[data-testid="address"]')
            city = self.clean_text(location_elem.text) if location_elem else ""
            
            price_elem = element.select_one('[data-testid="price-and-discounted-price"]')
            price = self.extract_price(price_elem.text) if price_elem else None
            
            listing = Listing(
                title=title,
                platform=self.platform_name,
                url=url,
                city=city,
                price_per_month=price,
            )
            
            return listing
            
        except Exception as e:
            logger.error(f"Error parsing listing element: {e}")
            return None
