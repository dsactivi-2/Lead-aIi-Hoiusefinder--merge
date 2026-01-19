"""
Email sender module (Step 3)
Responsible: Denis + Make
"""
import logging
from typing import Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from ..models import Employee, Listing
from ..config import settings
from .templates import EmailTemplate

logger = logging.getLogger(__name__)


class EmailSender:
    """Send emails to landlords"""
    
    def __init__(self):
        """Initialize SendGrid client"""
        self.client = None
        if settings.SENDGRID_API_KEY:
            self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        else:
            logger.warning("SendGrid API key not configured")
    
    def send_inquiry(
        self, 
        employee: Employee, 
        listing: Listing,
        to_email: str = None
    ) -> bool:
        """
        Send inquiry email to landlord
        
        Args:
            employee: Employee requiring accommodation
            listing: Accommodation listing
            to_email: Override email address (default: listing.email)
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.client:
            logger.error("SendGrid client not initialized")
            return False
        
        # Use provided email or listing email
        recipient_email = to_email or listing.email
        
        if not recipient_email:
            logger.error(f"No email address for listing: {listing.title}")
            return False
        
        try:
            # Generate email content
            email_content = EmailTemplate.create_inquiry_email(employee, listing)
            
            # Create email message
            message = Mail(
                from_email=(settings.FROM_EMAIL, settings.FROM_NAME),
                to_emails=recipient_email,
                subject=email_content['subject'],
                plain_text_content=email_content['body']
            )
            
            # Send email
            response = self.client.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent to {recipient_email} for {employee.name}")
                return True
            else:
                logger.error(f"Failed to send email: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    def send_batch_inquiries(
        self, 
        employee: Employee, 
        listings: list
    ) -> dict:
        """
        Send inquiry emails to multiple landlords
        
        Args:
            employee: Employee requiring accommodation
            listings: List of Listing objects
            
        Returns:
            Dictionary with success/failure counts
        """
        results = {
            'sent': 0,
            'failed': 0,
            'skipped': 0
        }
        
        for listing in listings:
            if not listing.email:
                results['skipped'] += 1
                continue
            
            success = self.send_inquiry(employee, listing)
            
            if success:
                results['sent'] += 1
            else:
                results['failed'] += 1
        
        logger.info(
            f"Batch email results for {employee.name}: "
            f"{results['sent']} sent, {results['failed']} failed, "
            f"{results['skipped']} skipped"
        )
        
        return results
