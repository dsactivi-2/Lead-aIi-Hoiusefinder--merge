"""
Tests for data models
"""
import pytest
from datetime import datetime
from src.models import Employee, Listing, AccommodationResult


class TestEmployee:
    """Test Employee model"""
    
    def test_employee_creation(self):
        """Test creating an employee"""
        employee = Employee(
            name="John Doe",
            start_date="15.01.2026",
            location="ATU Berlin",
            zip_code="13585",
            city="Berlin",
            state="Berlin",
            urgent=False
        )
        
        assert employee.name == "John Doe"
        assert employee.city == "Berlin"
        assert employee.urgent is False
        assert isinstance(employee.start_date, datetime)
    
    def test_urgent_parsing(self):
        """Test urgent flag parsing"""
        # Test various formats
        assert Employee(
            name="Test", start_date="01.01.2026", location="Test",
            zip_code="12345", city="Test", state="Test", urgent="Yes"
        ).urgent is True
        
        assert Employee(
            name="Test", start_date="01.01.2026", location="Test",
            zip_code="12345", city="Test", state="Test", urgent="No"
        ).urgent is False


class TestListing:
    """Test Listing model"""
    
    def test_listing_creation(self):
        """Test creating a listing"""
        listing = Listing(
            title="Nice Room",
            platform="Monteurzimmer.de",
            url="https://example.com",
            city="Berlin",
            price_per_month=800.0,
            phone="+49123456789",
            email="landlord@example.com"
        )
        
        assert listing.title == "Nice Room"
        assert listing.has_contact_info() is True
    
    def test_has_contact_info(self):
        """Test contact info detection"""
        # Has phone
        listing1 = Listing(
            title="Test", platform="Test", url="http://test.com",
            city="Berlin", phone="+49123"
        )
        assert listing1.has_contact_info() is True
        
        # Has email
        listing2 = Listing(
            title="Test", platform="Test", url="http://test.com",
            city="Berlin", email="test@test.com"
        )
        assert listing2.has_contact_info() is True
        
        # Has neither
        listing3 = Listing(
            title="Test", platform="Test", url="http://test.com",
            city="Berlin"
        )
        assert listing3.has_contact_info() is False


class TestAccommodationResult:
    """Test AccommodationResult model"""
    
    def test_result_creation(self):
        """Test creating a result"""
        result = AccommodationResult(
            employee_name="John Doe",
            location="Berlin",
            urgent=False,
            verfuegbar="Ja",
            preis_monat="800 EUR",
            adresse_unterkunft="Main St. 1, Berlin"
        )
        
        assert result.employee_name == "John Doe"
        assert result.verfuegbar == "Ja"
    
    def test_to_sheet_row(self):
        """Test conversion to sheet row"""
        result = AccommodationResult(
            employee_name="John Doe",
            location="Berlin",
            urgent=True,
            verfuegbar="Ja"
        )
        
        row = result.to_sheet_row()
        assert isinstance(row, list)
        assert row[0] == "John Doe"
        assert row[1] == "Berlin"
        assert row[2] == "Yes"
    
    def test_get_sheet_headers(self):
        """Test getting sheet headers"""
        headers = AccommodationResult.get_sheet_headers()
        assert isinstance(headers, list)
        assert "Employee Name" in headers
        assert "Available" in headers
