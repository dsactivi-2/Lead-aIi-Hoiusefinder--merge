"""
WhatsApp sender module (Step 4)
Responsible: Emir
"""
import logging
from typing import Optional, Dict
import requests
from ..models import Employee, Listing
from ..config import settings
from .templates import WhatsAppTemplate

logger = logging.getLogger(__name__)


class WhatsAppSender:
    """Send WhatsApp messages using WhatsApp Business Cloud API"""
    
    BASE_URL = "https://graph.facebook.com/v18.0"
    
    def __init__(self):
        """Initialize WhatsApp Business API client"""
        self.access_token = settings.WHATSAPP_ACCESS_TOKEN
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        
        if not self.access_token or not self.phone_number_id:
            logger.warning("WhatsApp API credentials not configured")
    
    def send_message(
        self, 
        to_phone: str, 
        message: str
    ) -> bool:
        """
        Send WhatsApp message
        
        Args:
            to_phone: Recipient phone number (E.164 format)
            message: Message text
            
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.access_token or not self.phone_number_id:
            logger.error("WhatsApp API not configured")
            return False
        
        try:
            # Clean phone number
            clean_phone = self._clean_phone_number(to_phone)
            
            if not clean_phone:
                logger.error(f"Invalid phone number: {to_phone}")
                return False
            
            # Prepare API request
            url = f"{self.BASE_URL}/{self.phone_number_id}/messages"
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'messaging_product': 'whatsapp',
                'to': clean_phone,
                'type': 'text',
                'text': {
                    'body': message
                }
            }
            
            # Send request
            response = requests.post(url, json=data, headers=headers, timeout=30)
            response.raise_for_status()
            
            logger.info(f"WhatsApp message sent to {clean_phone}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}")
            return False
    
    def send_inquiry(
        self, 
        employee: Employee, 
        listing: Listing,
        to_phone: str = None
    ) -> bool:
        """
        Send inquiry WhatsApp message to landlord
        
        Args:
            employee: Employee requiring accommodation
            listing: Accommodation listing
            to_phone: Override phone number (default: listing.phone)
            
        Returns:
            True if sent successfully, False otherwise
        """
        # Use provided phone or listing phone
        recipient_phone = to_phone or listing.phone
        
        if not recipient_phone:
            logger.error(f"No phone number for listing: {listing.title}")
            return False
        
        # Generate message content
        message = WhatsAppTemplate.create_initial_message(employee, listing)
        
        return self.send_message(recipient_phone, message)
    
    def send_followup(
        self, 
        employee: Employee,
        to_phone: str
    ) -> bool:
        """
        Send follow-up WhatsApp message
        
        Args:
            employee: Employee requiring accommodation
            to_phone: Recipient phone number
            
        Returns:
            True if sent successfully, False otherwise
        """
        message = WhatsAppTemplate.create_followup_message(employee)
        return self.send_message(to_phone, message)
    
    def send_batch_inquiries(
        self, 
        employee: Employee, 
        listings: list
    ) -> dict:
        """
        Send inquiry WhatsApp messages to multiple landlords
        
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
            if not listing.phone:
                results['skipped'] += 1
                continue
            
            success = self.send_inquiry(employee, listing)
            
            if success:
                results['sent'] += 1
            else:
                results['failed'] += 1
        
        logger.info(
            f"Batch WhatsApp results for {employee.name}: "
            f"{results['sent']} sent, {results['failed']} failed, "
            f"{results['skipped']} skipped"
        )
        
        return results
    
    def _clean_phone_number(self, phone: str) -> Optional[str]:
        """
        Clean and format phone number to E.164 format
        
        Args:
            phone: Phone number in various formats
            
        Returns:
            Cleaned phone number or None
        """
        if not phone:
            return None
        
        # Remove all non-digit characters
        digits = ''.join(c for c in phone if c.isdigit())
        
        # Handle German numbers
        if digits.startswith('0'):
            # Replace leading 0 with +49
            digits = '49' + digits[1:]
        elif not digits.startswith('49'):
            # Assume German number without country code
            digits = '49' + digits
        
        # E.164 format requires + prefix
        return '+' + digits if digits else None
    
    def handle_webhook(self, webhook_data: Dict) -> Dict:
        """
        Handle incoming WhatsApp webhook (landlord replies)
        
        Args:
            webhook_data: Webhook payload from WhatsApp
            
        Returns:
            Extracted information from message
        """
        try:
            # Extract message details
            entry = webhook_data.get('entry', [{}])[0]
            changes = entry.get('changes', [{}])[0]
            value = changes.get('value', {})
            messages = value.get('messages', [])
            
            if not messages:
                return {}
            
            message = messages[0]
            
            result = {
                'from': message.get('from'),
                'message_id': message.get('id'),
                'timestamp': message.get('timestamp'),
                'type': message.get('type'),
                'text': message.get('text', {}).get('body', '') if message.get('type') == 'text' else ''
            }
            
            logger.info(f"Received WhatsApp message from {result['from']}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            return {}
