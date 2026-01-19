"""
Base scraper class for all accommodation scrapers
"""
import logging
from abc import ABC, abstractmethod
from typing import List, Dict
import requests
from bs4 import BeautifulSoup
from ..models import Listing
from ..config import settings

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """Base class for all scrapers"""
    
    def __init__(self, platform_name: str):
        """
        Initialize scraper
        
        Args:
            platform_name: Name of the platform being scraped
        """
        self.platform_name = platform_name
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': settings.USER_AGENT
        })
        
    @abstractmethod
    def scrape(self, city: str, zip_code: str = None, **kwargs) -> List[Listing]:
        """
        Scrape listings for a given location
        
        Args:
            city: City name to search
            zip_code: Optional ZIP code
            **kwargs: Additional search parameters
            
        Returns:
            List of Listing objects
        """
        pass
    
    def get_page(self, url: str, params: Dict = None) -> BeautifulSoup:
        """
        Fetch and parse a web page
        
        Args:
            url: URL to fetch
            params: Optional query parameters
            
        Returns:
            BeautifulSoup object
        """
        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
    
    def extract_phone(self, text: str) -> str:
        """
        Extract phone number from text
        
        Args:
            text: Text containing phone number
            
        Returns:
            Extracted phone number or None
        """
        import re
        # German phone number patterns
        patterns = [
            r'\+49[\s\-]?\d{2,5}[\s\-]?\d{3,10}',
            r'0\d{2,5}[\s\-]?\d{3,10}',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0).strip()
        
        return None
    
    def extract_email(self, text: str) -> str:
        """
        Extract email address from text
        
        Args:
            text: Text containing email
            
        Returns:
            Extracted email or None
        """
        import re
        pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
        return None
    
    def extract_price(self, text: str) -> float:
        """
        Extract price from text
        
        Args:
            text: Text containing price
            
        Returns:
            Price as float or None
        """
        import re
        # Match patterns like "500 €", "€500", "500 EUR", "500,-"
        pattern = r'(\d+(?:[.,]\d{2})?)\s*(?:€|EUR|Euro)'
        match = re.search(pattern, text.replace(',', '.'))
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
        return None
    
    def clean_text(self, text: str) -> str:
        """
        Clean text by removing extra whitespace
        
        Args:
            text: Text to clean
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        return " ".join(text.split())
