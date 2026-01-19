"""
WG-Gesucht.de scraper
"""
import logging
from typing import List
from .base_scraper import BaseScraper
from ..models import Listing

logger = logging.getLogger(__name__)


class WGGesuchtScraper(BaseScraper):
    """Scraper for WG-Gesucht.de"""
    
    BASE_URL = "https://www.wg-gesucht.de"
    
    def __init__(self):
        super().__init__("WG-Gesucht")
    
    def scrape(self, city: str, zip_code: str = None, **kwargs) -> List[Listing]:
        """
        Scrape WG-Gesucht for room listings
        
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
        search_url = f"{self.BASE_URL}/wg-zimmer-in-{city}.html"
        
        try:
            soup = self.get_page(search_url)
            if not soup:
                return listings
            
            # Parse listings
            listing_elements = soup.select('#table-compact-list .list-details-panel-inner')
            
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
            title_elem = element.select_one('.headline')
            title = self.clean_text(title_elem.text) if title_elem else ""
            
            url_elem = element.select_one('a')
            url = self.BASE_URL + url_elem['href'] if url_elem and url_elem.get('href') else ""
            
            # Extract location from text
            detail_lines = element.select('.detail-size-price-wrapper .detailansicht')
            city = ""
            for line in detail_lines:
                text = line.text.strip()
                if any(keyword in text.lower() for keyword in ['stadtteil', 'bezirk']):
                    city = self.clean_text(text)
                    break
            
            # Extract price
            price_elem = element.select_one('.detail-size-price-wrapper .detailansicht:last-child')
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
