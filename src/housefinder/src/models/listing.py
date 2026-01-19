"""
Accommodation listing data model
"""
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl


class Listing(BaseModel):
    """Accommodation listing from scraping"""
    
    # Basic info
    title: str = Field(..., description="Listing title")
    platform: str = Field(..., description="Source platform (e.g., Monteurzimmer.de)")
    url: str = Field(..., description="Listing URL")
    
    # Location
    address: Optional[str] = Field(None, description="Full address")
    city: str = Field(..., description="City")
    zip_code: Optional[str] = Field(None, description="ZIP code")
    
    # Pricing
    price_per_month: Optional[float] = Field(None, description="Monthly price in EUR")
    price_per_person: Optional[float] = Field(None, description="Price per person in EUR")
    
    # Contact
    phone: Optional[str] = Field(None, description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    contact_name: Optional[str] = Field(None, description="Contact person name")
    
    # Details
    description: Optional[str] = Field(None, description="Full description")
    max_persons: Optional[int] = Field(None, description="Maximum number of persons")
    available_from: Optional[str] = Field(None, description="Available from date")
    min_rental_period: Optional[str] = Field(None, description="Minimum rental period")
    
    # Amenities
    has_internet: Optional[bool] = Field(None, description="Internet available")
    has_parking: Optional[bool] = Field(None, description="Parking available")
    
    # Calculated fields
    distance_km: Optional[float] = Field(None, description="Distance from work location in km")
    travel_time_min: Optional[int] = Field(None, description="Travel time in minutes")
    
    # Processing flags
    is_duplicate: bool = Field(default=False, description="Marked as duplicate")
    is_valid: bool = Field(default=True, description="Passes validation")
    validation_notes: Optional[str] = Field(None, description="Validation notes")
    
    def has_contact_info(self) -> bool:
        """Check if listing has any contact information"""
        return bool(self.phone or self.email)
    
    class Config:
        """Pydantic configuration"""
        validate_assignment = True
