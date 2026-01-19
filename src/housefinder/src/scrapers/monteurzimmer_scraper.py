"""
Monteurzimmer.de scraper implementation
"""
import logging
from typing import List
from .base_scraper import BaseScraper
from ..models import Listing

logger = logging.getLogger(__name__)


class MonteurzimmerScraper(BaseScraper):
    """Scraper for Monteurzimmer.de"""
    
    BASE_URL = "https://www.monteurzimmer.de"
    
    def __init__(self):
        super().__init__("Monteurzimmer.de")
    
    def scrape(self, city: str, zip_code: str = None, **kwargs) -> List[Listing]:
        """
        Scrape Monteurzimmer.de for listings
        
        Args:
            city: City name to search
            zip_code: Optional ZIP code
            **kwargs: Additional parameters
            
        Returns:
            List of Listing objects
        """
        logger.info(f"Scraping {self.platform_name} for {city}")
        
        listings = []
        
        # Build search URL
        search_url = f"{self.BASE_URL}/unterkunft-suchen"
        params = {'ort': city}
        
        try:
            soup = self.get_page(search_url, params)
            if not soup:
                return listings
            
            # Parse listings from search results
            # Note: This is a template - actual selectors need to be updated based on website structure
            listing_elements = soup.select('.listing-item')  # Update selector
            
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
        """
        Parse individual listing element
        
        Args:
            element: BeautifulSoup element
            
        Returns:
            Listing object or None
        """
        try:
            # Extract data from listing element
            # Note: Selectors are templates and need to be updated based on actual website structure
            
            title_elem = element.select_one('.title')  # Update selector
            title = self.clean_text(title_elem.text) if title_elem else ""
            
            url_elem = element.select_one('a')
            url = self.BASE_URL + url_elem['href'] if url_elem and url_elem.get('href') else ""
            
            location_elem = element.select_one('.location')  # Update selector
            city = self.clean_text(location_elem.text) if location_elem else ""
            
            price_elem = element.select_one('.price')  # Update selector
            price = self.extract_price(price_elem.text) if price_elem else None
            
            description_elem = element.select_one('.description')  # Update selector
            description = self.clean_text(description_elem.text) if description_elem else ""
            
            # Extract contact info from description or detail page
            phone = self.extract_phone(description)
            email = self.extract_email(description)
            
            listing = Listing(
                title=title,
                platform=self.platform_name,
                url=url,
                city=city,
                price_per_month=price,
                description=description,
                phone=phone,
                email=email,
            )
            
            return listing
            
        except Exception as e:
            logger.error(f"Error parsing listing element: {e}")
            return None
