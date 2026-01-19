"""
Listing filter and validator (Step 2)
Responsible: Arman
"""
import logging
from typing import List, Tuple
from ..models import Listing, Employee
from ..utils import RegionCalculator
from ..config import settings

logger = logging.getLogger(__name__)


class ListingFilter:
    """Filter and validate accommodation listings"""
    
    def __init__(self):
        """Initialize filter with region calculator"""
        self.region_calculator = RegionCalculator()
        
    def filter_listings(
        self, 
        listings: List[Listing], 
        employee: Employee,
        center_coords: Tuple[float, float] = None
    ) -> List[Listing]:
        """
        Filter listings based on employee requirements
        
        Removes listings that:
        - Are outside the 35 km radius
        - Exceed the allowed budget
        - Have no contact details
        - Are marked as duplicates
        
        Args:
            listings: List of listings to filter
            employee: Employee requiring accommodation
            center_coords: Center coordinates (work location)
            
        Returns:
            Filtered list of valid listings
        """
        logger.info(f"Filtering {len(listings)} listings for {employee.name}")
        
        # Get center coordinates if not provided
        if not center_coords:
            center_coords = self.region_calculator.get_coordinates(
                employee.zip_code, 
                employee.city, 
                employee.state
            )
        
        if not center_coords:
            logger.warning(f"Could not geocode work location for {employee.name}")
        
        filtered = []
        
        for listing in listings:
            # Check if listing has contact info
            if not listing.has_contact_info():
                listing.is_valid = False
                listing.validation_notes = "No contact information"
                continue
            
            # Calculate distance if possible
            if center_coords and listing.city:
                try:
                    listing_coords = self.region_calculator.get_coordinates(
                        listing.zip_code or "", 
                        listing.city
                    )
                    
                    if listing_coords:
                        distance = self.region_calculator.calculate_distance(
                            center_coords, 
                            listing_coords
                        )
                        listing.distance_km = round(distance, 2)
                        
                        # Filter by radius
                        if distance > settings.MAX_RADIUS_KM:
                            listing.is_valid = False
                            listing.validation_notes = f"Too far: {distance:.1f}km"
                            continue
                        
                except Exception as e:
                    logger.warning(f"Could not calculate distance for listing: {e}")
            
            # Filter by budget
            budget_max = employee.budget_max or settings.DEFAULT_BUDGET_MAX
            if listing.price_per_month and listing.price_per_month > budget_max:
                listing.is_valid = False
                listing.validation_notes = f"Over budget: €{listing.price_per_month} > €{budget_max}"
                continue
            
            # Check if marked as duplicate
            if listing.is_duplicate:
                listing.is_valid = False
                listing.validation_notes = "Duplicate listing"
                continue
            
            # Listing passes all filters
            filtered.append(listing)
        
        logger.info(f"Filtered to {len(filtered)} valid listings")
        return filtered
    
    def remove_duplicates(self, listings: List[Listing]) -> List[Listing]:
        """
        Remove duplicate listings (same accommodation on different platforms)
        
        Duplicates are identified by:
        - Same or very similar title
        - Same city
        - Same or similar price
        - Same phone or email
        
        Args:
            listings: List of listings
            
        Returns:
            List with duplicates removed
        """
        logger.info(f"Checking for duplicates in {len(listings)} listings")
        
        # Track seen listings
        seen = {}
        unique = []
        
        for listing in listings:
            # Create a signature for comparison
            signature = self._create_signature(listing)
            
            if signature in seen:
                # Mark as duplicate
                listing.is_duplicate = True
                logger.debug(f"Duplicate found: {listing.title} (matches {seen[signature].platform})")
            else:
                seen[signature] = listing
                unique.append(listing)
        
        logger.info(f"Found {len(listings) - len(unique)} duplicates, {len(unique)} unique listings")
        return unique
    
    def _create_signature(self, listing: Listing) -> str:
        """
        Create a signature for duplicate detection
        
        Args:
            listing: Listing to create signature for
            
        Returns:
            Signature string
        """
        parts = []
        
        # Use normalized title (first 50 chars, lowercase, no special chars)
        if listing.title:
            normalized_title = ''.join(c.lower() for c in listing.title[:50] if c.isalnum())
            parts.append(normalized_title)
        
        # Use city
        if listing.city:
            parts.append(listing.city.lower().strip())
        
        # Use price (rounded to nearest 50)
        if listing.price_per_month:
            rounded_price = round(listing.price_per_month / 50) * 50
            parts.append(str(rounded_price))
        
        # Use contact info
        if listing.phone:
            # Normalize phone (remove spaces, dashes)
            normalized_phone = ''.join(c for c in listing.phone if c.isdigit())
            parts.append(normalized_phone)
        
        if listing.email:
            parts.append(listing.email.lower().strip())
        
        return '|'.join(parts)
    
    def validate_suitability(self, listing: Listing) -> bool:
        """
        Check if listing is suitable for Monteur accommodation
        
        Args:
            listing: Listing to validate
            
        Returns:
            True if suitable, False otherwise
        """
        # Check for keywords that indicate suitability
        suitable_keywords = [
            'monteur', 'arbeiter', 'worker', 'handwerker',
            'möbliert', 'furnished', 'vollmöbliert',
            'kurzzeitvermietung', 'short-term'
        ]
        
        unsuitable_keywords = [
            'wg', 'studenten', 'student', 'azubi',
            'nur für', 'only for'
        ]
        
        text = (listing.title + " " + (listing.description or "")).lower()
        
        # Check unsuitable keywords first
        for keyword in unsuitable_keywords:
            if keyword in text:
                logger.debug(f"Unsuitable listing (contains '{keyword}'): {listing.title}")
                return False
        
        # Check suitable keywords (more lenient - not required)
        has_suitable = any(keyword in text for keyword in suitable_keywords)
        
        # If explicitly mentions monteur/worker, definitely suitable
        if has_suitable:
            return True
        
        # Otherwise, consider it potentially suitable (let human review)
        return True
