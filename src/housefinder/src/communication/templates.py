"""
Email and WhatsApp message templates
"""
from datetime import datetime
from typing import Dict
from ..models import Employee, Listing


class EmailTemplate:
    """Email templates (Step 3 - Responsible: Denis)"""
    
    @staticmethod
    def create_inquiry_email(employee: Employee, listing: Listing) -> Dict[str, str]:
        """
        Create personalized inquiry email
        
        Args:
            employee: Employee requiring accommodation
            listing: Accommodation listing
            
        Returns:
            Dictionary with 'subject', 'body'
        """
        # Format start date
        start_date = employee.start_date.strftime('%d.%m.%Y')
        
        # Subject line - add URGENT prefix if needed
        if employee.urgent:
            subject = f"DRINGEND – Unterkunft benötigt ab {start_date}"
        else:
            subject = f"Anfrage: Unterkunft für Mitarbeiter ab {start_date}"
        
        # Personalized body
        body = f"""Sehr geehrte Damen und Herren,

wir suchen für unseren Mitarbeiter {employee.name} eine Unterkunft in der Nähe von {employee.location}.

Details:
- Benötigt ab: {start_date}
- Anzahl Personen: {employee.num_persons}
- Standort: {employee.location}, {employee.zip_code} {employee.city}
- Budget: ca. €{employee.budget_max if employee.budget_max else 'verhandelbar'} pro Monat

Wir haben Ihre Unterkunft auf {listing.platform} gefunden und möchten gerne mehr erfahren:
{listing.url}

Könnten Sie uns bitte folgende Informationen zukommen lassen:
1. Ist die Unterkunft ab {start_date} verfügbar?
2. Was ist der monatliche Mietpreis (inkl. Nebenkosten)?
3. Wie ist die Mindestmietdauer?
4. Sind Internet und Parkplatz vorhanden?

Wir freuen uns auf Ihre Rückmeldung.

Mit freundlichen Grüßen
Step2Job Housing Team

---
Step2Job GmbH
housing@step2job.com
"""
        
        if employee.urgent:
            body = "⚠️ DRINGEND ⚠️\n\n" + body
        
        return {
            'subject': subject,
            'body': body
        }


class WhatsAppTemplate:
    """WhatsApp message templates (Step 4 - Responsible: Emir)"""
    
    @staticmethod
    def create_initial_message(employee: Employee, listing: Listing) -> str:
        """
        Create initial WhatsApp message
        
        Args:
            employee: Employee requiring accommodation
            listing: Accommodation listing
            
        Returns:
            WhatsApp message text
        """
        start_date = employee.start_date.strftime('%d.%m.%Y')
        
        message = f"""Hallo,

wir sind Step2Job und suchen eine Unterkunft für unseren Mitarbeiter.

👤 Mitarbeiter: {employee.name}
📅 Ab: {start_date}
👥 Personen: {employee.num_persons}
📍 Standort: {employee.location}, {employee.city}

Ihre Unterkunft auf {listing.platform} interessiert uns:
{listing.url}

Fragen:
✓ Verfügbar ab {start_date}?
✓ Monatspreis inkl. Nebenkosten?
✓ Mindestmietdauer?
✓ Internet & Parkplatz?

Vielen Dank!
Step2Job Housing Team"""
        
        if employee.urgent:
            message = "⚠️ *DRINGEND* ⚠️\n\n" + message
        
        return message
    
    @staticmethod
    def create_followup_message(employee: Employee) -> str:
        """
        Create follow-up WhatsApp message
        
        Args:
            employee: Employee requiring accommodation
            
        Returns:
            Follow-up message text
        """
        message = f"""Hallo,

wir haben vor einigen Stunden eine Anfrage geschickt bezüglich Unterkunft für {employee.name}.

Haben Sie unsere Nachricht gesehen?

Bitte lassen Sie uns wissen, ob Sie verfügbar sind.

Vielen Dank!
Step2Job Housing Team"""
        
        if employee.urgent:
            message = "⚠️ *DRINGEND* ⚠️\n\n" + message
        
        return message
    
    @staticmethod
    def create_thank_you_message() -> str:
        """Create thank you message after response"""
        return """Vielen Dank für Ihre schnelle Rückmeldung!

Wir prüfen die Informationen und melden uns zeitnah.

Mit freundlichen Grüßen
Step2Job Housing Team"""
