"""
Ebay Kleinanzeigen scraper for rooms and flats
"""
import logging
from typing import List
from .base_scraper import BaseScraper
from ..models import Listing

logger = logging.getLogger(__name__)


class EbayKleinanzeigenScraper(BaseScraper):
    """Scraper for Ebay Kleinanzeigen (now Kleinanzeigen.de)"""
    
    BASE_URL = "https://www.kleinanzeigen.de"
    
    def __init__(self):
        super().__init__("Ebay Kleinanzeigen")
    
    def scrape(self, city: str, zip_code: str = None, **kwargs) -> List[Listing]:
        """
        Scrape Ebay Kleinanzeigen for room/flat listings
        
        Args:
            city: City name to search
            zip_code: Optional ZIP code
            **kwargs: Additional parameters
            
        Returns:
            List of Listing objects
        """
        logger.info(f"Scraping {self.platform_name} for {city}")
        
        listings = []
        
        # Search in "Wohnung zur Miete" category
        search_url = f"{self.BASE_URL}/s-wohnung-zur-miete/{city}/c203"
        
        try:
            soup = self.get_page(search_url)
            if not soup:
                return listings
            
            # Parse listings
            listing_elements = soup.select('.aditem')
            
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
            title_elem = element.select_one('.text-module-begin a')
            title = self.clean_text(title_elem.text) if title_elem else ""
            
            url_elem = element.select_one('.text-module-begin a')
            url = self.BASE_URL + url_elem['href'] if url_elem and url_elem.get('href') else ""
            
            location_elem = element.select_one('.aditem-main--top--left')
            city = self.clean_text(location_elem.text) if location_elem else ""
            
            price_elem = element.select_one('.aditem-main--middle--price-shipping--price')
            price = self.extract_price(price_elem.text) if price_elem else None
            
            description_elem = element.select_one('.aditem-main--middle--description')
            description = self.clean_text(description_elem.text) if description_elem else ""
            
            listing = Listing(
                title=title,
                platform=self.platform_name,
                url=url,
                city=city,
                price_per_month=price,
                description=description,
            )
            
            return listing
            
        except Exception as e:
            logger.error(f"Error parsing listing element: {e}")
            return None
