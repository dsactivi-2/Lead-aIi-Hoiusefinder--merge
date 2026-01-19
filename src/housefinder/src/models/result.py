"""
Accommodation result model (from landlord responses)
"""
from typing import Optional
from pydantic import BaseModel, Field


class AccommodationResult(BaseModel):
    """Result from landlord response analysis"""
    
    # Employee info
    employee_name: str = Field(..., description="Employee name")
    location: str = Field(..., description="Work location")
    urgent: bool = Field(default=False, description="Urgent case")
    
    # Landlord response
    verfuegbar: Optional[str] = Field(None, description="Available (Yes/No)")
    preis_monat: Optional[str] = Field(None, description="Monthly price")
    preis_pro_person: Optional[str] = Field(None, description="Price per person")
    kaution: Optional[str] = Field(None, description="Deposit")
    zusatzkosten: Optional[str] = Field(None, description="Additional costs")
    frei_ab: Optional[str] = Field(None, description="Available from date")
    
    # Contact and location
    adresse_unterkunft: Optional[str] = Field(None, description="Accommodation address")
    kontaktperson: Optional[str] = Field(None, description="Contact person")
    telefon: Optional[str] = Field(None, description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    
    # Details
    internet: Optional[str] = Field(None, description="Internet available")
    parkplatz: Optional[str] = Field(None, description="Parking available")
    mindestmietdauer: Optional[str] = Field(None, description="Minimum rental period")
    max_personen: Optional[str] = Field(None, description="Maximum persons")
    
    # Distance and travel
    entfernung_km: Optional[str] = Field(None, description="Distance in km")
    fahrzeit_min: Optional[str] = Field(None, description="Travel time in minutes")
    
    # Links and notes
    url: Optional[str] = Field(None, description="Listing URL")
    bemerkung: Optional[str] = Field(None, description="Additional remarks")
    
    # Response metadata
    response_source: Optional[str] = Field(None, description="Email or WhatsApp")
    response_date: Optional[str] = Field(None, description="Response date")
    
    # Ranking
    rank: Optional[int] = Field(None, description="Ranking position (1-3 for top offers)")
    warnings: Optional[str] = Field(None, description="Warnings (too far, too expensive, etc.)")
    
    def to_sheet_row(self) -> list:
        """Convert to Google Sheets row format"""
        return [
            self.employee_name,
            self.location,
            "Yes" if self.urgent else "No",
            self.verfuegbar or "",
            self.preis_monat or "",
            self.preis_pro_person or "",
            self.kaution or "",
            self.zusatzkosten or "",
            self.frei_ab or "",
            self.adresse_unterkunft or "",
            self.kontaktperson or "",
            self.telefon or "",
            self.email or "",
            self.internet or "",
            self.parkplatz or "",
            self.mindestmietdauer or "",
            self.max_personen or "",
            self.entfernung_km or "",
            self.fahrzeit_min or "",
            self.url or "",
            self.bemerkung or "",
            self.response_source or "",
            self.response_date or "",
            str(self.rank) if self.rank else "",
            self.warnings or "",
        ]
    
    @staticmethod
    def get_sheet_headers() -> list:
        """Get headers for Google Sheets"""
        return [
            "Employee Name",
            "Location",
            "Urgent",
            "Available",
            "Monthly Price",
            "Price per Person",
            "Deposit",
            "Additional Costs",
            "Available From",
            "Address",
            "Contact Person",
            "Phone",
            "Email",
            "Internet",
            "Parking",
            "Min Rental Period",
            "Max Persons",
            "Distance (km)",
            "Travel Time (min)",
            "URL",
            "Remarks",
            "Response Source",
            "Response Date",
            "Rank",
            "Warnings",
        ]
