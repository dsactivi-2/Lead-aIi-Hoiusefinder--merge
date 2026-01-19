"""Web scraping modules (Step 1 - Responsible: Arman)"""
from .base_scraper import BaseScraper
from .monteurzimmer_scraper import MonteurzimmerScraper
from .booking_scraper import BookingScraper
from .airbnb_scraper import AirbnbScraper
from .wg_gesucht_scraper import WGGesuchtScraper
from .ebay_kleinanzeigen_scraper import EbayKleinanzeigenScraper

__all__ = [
    'BaseScraper',
    'MonteurzimmerScraper',
    'BookingScraper',
    'AirbnbScraper',
    'WGGesuchtScraper',
    'EbayKleinanzeigenScraper',
]
