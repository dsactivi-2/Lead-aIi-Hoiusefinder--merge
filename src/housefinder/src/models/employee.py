"""
Employee data model
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator


class Employee(BaseModel):
    """Employee requiring accommodation"""
    
    name: str = Field(..., description="Employee name")
    start_date: datetime = Field(..., description="Start date at location")
    location: str = Field(..., description="Work location name")
    zip_code: str = Field(..., description="ZIP code of work location")
    city: str = Field(..., description="City of work location")
    state: str = Field(..., description="State/region")
    urgent: bool = Field(default=False, description="Urgent accommodation needed")
    budget_max: Optional[int] = Field(default=None, description="Maximum monthly budget in EUR")
    num_persons: int = Field(default=1, description="Number of persons needing accommodation")
    
    @validator('start_date', pre=True)
    def parse_date(cls, v):
        """Parse date from string if needed"""
        if isinstance(v, str):
            # Try different date formats
            for fmt in ['%d.%m.%Y', '%Y-%m-%d', '%m/%d/%Y']:
                try:
                    return datetime.strptime(v, fmt)
                except ValueError:
                    continue
            raise ValueError(f'Unable to parse date: {v}')
        return v
    
    @validator('urgent', pre=True)
    def parse_urgent(cls, v):
        """Parse urgent flag from various formats"""
        if isinstance(v, str):
            return v.lower() in ['yes', 'ja', 'true', '1']
        return bool(v)
    
    class Config:
        """Pydantic configuration"""
        json_encoders = {
            datetime: lambda v: v.strftime('%d.%m.%Y')
        }
