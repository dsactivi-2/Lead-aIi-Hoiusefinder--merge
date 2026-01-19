"""
Region Calculator - Calculate search radius and nearby towns (Step 0.1)
Responsible: Denis + ChatGPT
"""
import logging
from typing import List, Tuple, Dict
from geopy.geocoders import Nominatim
from geopy.distance import geodesic
from ..config import settings

logger = logging.getLogger(__name__)


class RegionCalculator:
    """Calculate search region based on ZIP code and city"""
    
    def __init__(self):
        """Initialize geocoder"""
        self.geolocator = Nominatim(user_agent="housefinder")
        
    def get_coordinates(self, zip_code: str, city: str, state: str = None) -> Tuple[float, float]:
        """
        Get coordinates for a location
        
        Args:
            zip_code: ZIP/postal code
            city: City name
            state: Optional state name
            
        Returns:
            Tuple of (latitude, longitude)
        """
        try:
            # Try with full address first
            query_parts = [zip_code, city]
            if state:
                query_parts.append(state)
            query_parts.append("Germany")  # Assuming German locations
            
            query = ", ".join(query_parts)
            location = self.geolocator.geocode(query, timeout=10)
            
            if location:
                logger.info(f"Found coordinates for {city}: {location.latitude}, {location.longitude}")
                return (location.latitude, location.longitude)
            
            # Fallback: try just city and country
            query = f"{city}, Germany"
            location = self.geolocator.geocode(query, timeout=10)
            
            if location:
                logger.info(f"Found coordinates (fallback) for {city}: {location.latitude}, {location.longitude}")
                return (location.latitude, location.longitude)
            
            logger.warning(f"Could not find coordinates for {city}")
            return None
            
        except Exception as e:
            logger.error(f"Error getting coordinates for {city}: {e}")
            return None
    
    def calculate_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calculate distance between two coordinates in kilometers
        
        Args:
            coord1: First coordinate (lat, lon)
            coord2: Second coordinate (lat, lon)
            
        Returns:
            Distance in kilometers
        """
        try:
            return geodesic(coord1, coord2).kilometers
        except Exception as e:
            logger.error(f"Error calculating distance: {e}")
            return 0.0
    
    def get_search_region(
        self, 
        zip_code: str, 
        city: str, 
        state: str = None,
        min_radius_km: int = None,
        max_radius_km: int = None
    ) -> Dict:
        """
        Calculate search region for accommodation
        
        Args:
            zip_code: ZIP code of work location
            city: City of work location
            state: State/region
            min_radius_km: Minimum search radius (default from settings)
            max_radius_km: Maximum search radius (default from settings)
            
        Returns:
            Dictionary with region information
        """
        min_radius = min_radius_km or settings.MIN_RADIUS_KM
        max_radius = max_radius_km or settings.MAX_RADIUS_KM
        
        coordinates = self.get_coordinates(zip_code, city, state)
        
        if not coordinates:
            return {
                'center_zip': zip_code,
                'center_city': city,
                'center_coordinates': None,
                'min_radius_km': min_radius,
                'max_radius_km': max_radius,
                'nearby_cities': [],
                'error': 'Could not geocode location'
            }
        
        # Get nearby cities (this is simplified - in production, use a cities database)
        nearby_cities = self._find_nearby_cities(coordinates, max_radius)
        
        return {
            'center_zip': zip_code,
            'center_city': city,
            'center_coordinates': coordinates,
            'min_radius_km': min_radius,
            'max_radius_km': max_radius,
            'nearby_cities': nearby_cities,
        }
    
    def _find_nearby_cities(
        self, 
        center_coords: Tuple[float, float], 
        radius_km: float
    ) -> List[Dict]:
        """
        Find nearby cities within radius
        
        Note: This is a simplified implementation.
        In production, use a proper cities database or API.
        
        Args:
            center_coords: Center coordinates (lat, lon)
            radius_km: Search radius in km
            
        Returns:
            List of nearby city dictionaries
        """
        # This would query a database of German cities
        # For now, return empty list - to be implemented with proper data source
        logger.info(f"Finding cities within {radius_km}km of {center_coords}")
        
        # TODO: Implement with proper cities database
        # Could use:
        # - GeoNames database
        # - OpenStreetMap Nominatim API
        # - Custom database of German cities
        
        return []
    
    def is_within_radius(
        self,
        location_coords: Tuple[float, float],
        center_coords: Tuple[float, float],
        max_radius_km: float
    ) -> bool:
        """
        Check if location is within search radius
        
        Args:
            location_coords: Location to check
            center_coords: Center point
            max_radius_km: Maximum radius in km
            
        Returns:
            True if within radius, False otherwise
        """
        if not location_coords or not center_coords:
            return False
        
        distance = self.calculate_distance(center_coords, location_coords)
        return distance <= max_radius_km
