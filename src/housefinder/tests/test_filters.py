"""
Tests for listing filters
"""
import pytest
from src.models import Employee, Listing
from src.filters import ListingFilter


class TestListingFilter:
    """Test ListingFilter"""
    
    @pytest.fixture
    def filter(self):
        """Create filter instance"""
        return ListingFilter()
    
    @pytest.fixture
    def employee(self):
        """Create test employee"""
        return Employee(
            name="Test Employee",
            start_date="01.01.2026",
            location="Berlin",
            zip_code="13585",
            city="Berlin",
            state="Berlin",
            urgent=False,
            budget_max=1000
        )
    
    def test_remove_duplicates(self, filter):
        """Test duplicate removal"""
        listings = [
            Listing(
                title="Nice Room in Berlin",
                platform="Platform A",
                url="http://a.com",
                city="Berlin",
                price_per_month=800.0,
                phone="+49123456789"
            ),
            Listing(
                title="Nice Room in Berlin",
                platform="Platform B",
                url="http://b.com",
                city="Berlin",
                price_per_month=800.0,
                phone="+49123456789"
            ),
            Listing(
                title="Different Room",
                platform="Platform C",
                url="http://c.com",
                city="Berlin",
                price_per_month=900.0,
                phone="+49987654321"
            ),
        ]
        
        unique = filter.remove_duplicates(listings)
        
        # Should keep first and third, mark second as duplicate
        assert len(unique) == 2
        assert unique[0].title == "Nice Room in Berlin"
        assert unique[1].title == "Different Room"
    
    def test_filter_by_budget(self, filter, employee):
        """Test budget filtering"""
        listings = [
            Listing(
                title="Cheap", platform="Test", url="http://test.com",
                city="Berlin", price_per_month=500.0, phone="+49123"
            ),
            Listing(
                title="OK", platform="Test", url="http://test.com",
                city="Berlin", price_per_month=1000.0, phone="+49123"
            ),
            Listing(
                title="Expensive", platform="Test", url="http://test.com",
                city="Berlin", price_per_month=1500.0, phone="+49123"
            ),
        ]
        
        filtered = filter.filter_listings(listings, employee)
        
        # Should keep only first two (within budget)
        assert len(filtered) == 2
        assert all(l.price_per_month <= employee.budget_max for l in filtered)
    
    def test_filter_no_contact(self, filter, employee):
        """Test filtering listings without contact info"""
        listings = [
            Listing(
                title="With Contact", platform="Test", url="http://test.com",
                city="Berlin", phone="+49123"
            ),
            Listing(
                title="No Contact", platform="Test", url="http://test.com",
                city="Berlin"
            ),
        ]
        
        filtered = filter.filter_listings(listings, employee)
        
        # Should keep only listing with contact
        assert len(filtered) == 1
        assert filtered[0].title == "With Contact"
    
    def test_validate_suitability(self, filter):
        """Test suitability validation"""
        # Suitable listing
        suitable = Listing(
            title="Monteurzimmer möbliert",
            platform="Test",
            url="http://test.com",
            city="Berlin",
            phone="+49123"
        )
        assert filter.validate_suitability(suitable) is True
        
        # Unsuitable listing (WG)
        unsuitable = Listing(
            title="WG nur für Studenten",
            platform="Test",
            url="http://test.com",
            city="Berlin",
            phone="+49123"
        )
        assert filter.validate_suitability(unsuitable) is False
