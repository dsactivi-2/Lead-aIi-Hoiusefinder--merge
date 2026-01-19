"""
AI Response Analyzer (Step 5)
Responsible: Emir + Make
Uses GPT to extract structured information from landlord responses
"""
import logging
import json
from typing import Dict, Optional
import openai
from ..models import AccommodationResult, Employee
from ..config import settings

logger = logging.getLogger(__name__)


class ResponseAnalyzer:
    """Analyze landlord responses using GPT"""
    
    def __init__(self):
        """Initialize OpenAI client"""
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
        else:
            logger.warning("OpenAI API key not configured")
    
    def analyze_response(
        self, 
        response_text: str,
        employee: Employee,
        listing_url: str = None,
        response_source: str = "Email"
    ) -> Optional[AccommodationResult]:
        """
        Analyze landlord response and extract structured information
        
        Args:
            response_text: The landlord's response (email or WhatsApp)
            employee: Employee requiring accommodation
            listing_url: URL of the original listing
            response_source: "Email" or "WhatsApp"
            
        Returns:
            AccommodationResult object or None
        """
        if not settings.OPENAI_API_KEY:
            logger.error("OpenAI API key not configured")
            return None
        
        try:
            # Create the system prompt
            system_prompt = """Du bist ein Assistent, der Antworten von Vermietern analysiert.
Extrahiere alle relevanten Informationen und gib sie im folgenden JSON-Format zurück:

{
  "verfuegbar": "Ja/Nein/Unklar",
  "preis_monat": "Betrag in EUR oder leer",
  "preis_pro_person": "Betrag in EUR oder leer",
  "kaution": "Betrag oder leer",
  "zusatzkosten": "Beschreibung oder leer",
  "frei_ab": "Datum oder leer",
  "adresse_unterkunft": "Adresse oder leer",
  "kontaktperson": "Name oder leer",
  "telefon": "Telefonnummer oder leer",
  "email": "E-Mail oder leer",
  "internet": "Ja/Nein/Unklar",
  "parkplatz": "Ja/Nein/Unklar",
  "mindestmietdauer": "Zeitraum oder leer",
  "max_personen": "Anzahl oder leer",
  "entfernung_km": "Entfernung oder leer",
  "fahrzeit_min": "Fahrzeit oder leer",
  "bemerkung": "Zusätzliche wichtige Informationen"
}

Wenn eine Information nicht vorhanden ist, gib einen leeren String zurück.
Antworte NUR mit dem JSON-Objekt, ohne zusätzlichen Text."""
            
            # Create user prompt with the response
            user_prompt = f"""Analysiere folgende Antwort eines Vermieters:

{response_text}

Extrahiere alle Informationen im JSON-Format."""
            
            # Call GPT
            response = openai.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            # Parse response
            content = response.choices[0].message.content
            extracted_data = json.loads(content)
            
            # Create AccommodationResult
            result = AccommodationResult(
                employee_name=employee.name,
                location=employee.location,
                urgent=employee.urgent,
                verfuegbar=extracted_data.get('verfuegbar'),
                preis_monat=extracted_data.get('preis_monat'),
                preis_pro_person=extracted_data.get('preis_pro_person'),
                kaution=extracted_data.get('kaution'),
                zusatzkosten=extracted_data.get('zusatzkosten'),
                frei_ab=extracted_data.get('frei_ab'),
                adresse_unterkunft=extracted_data.get('adresse_unterkunft'),
                kontaktperson=extracted_data.get('kontaktperson'),
                telefon=extracted_data.get('telefon'),
                email=extracted_data.get('email'),
                internet=extracted_data.get('internet'),
                parkplatz=extracted_data.get('parkplatz'),
                mindestmietdauer=extracted_data.get('mindestmietdauer'),
                max_personen=extracted_data.get('max_personen'),
                entfernung_km=extracted_data.get('entfernung_km'),
                fahrzeit_min=extracted_data.get('fahrzeit_min'),
                url=listing_url,
                bemerkung=extracted_data.get('bemerkung'),
                response_source=response_source
            )
            
            logger.info(f"Successfully analyzed response for {employee.name}")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing response: {e}")
            return None
    
    def analyze_batch(
        self,
        responses: list,
        employee: Employee
    ) -> list:
        """
        Analyze multiple responses
        
        Args:
            responses: List of dictionaries with 'text', 'url', 'source'
            employee: Employee requiring accommodation
            
        Returns:
            List of AccommodationResult objects
        """
        results = []
        
        for response_data in responses:
            result = self.analyze_response(
                response_text=response_data.get('text', ''),
                employee=employee,
                listing_url=response_data.get('url'),
                response_source=response_data.get('source', 'Email')
            )
            
            if result:
                results.append(result)
        
        logger.info(f"Analyzed {len(results)} responses for {employee.name}")
        return results
    
    def quick_check_availability(self, response_text: str) -> bool:
        """
        Quick check if response indicates availability
        
        Args:
            response_text: Response text
            
        Returns:
            True if likely available, False otherwise
        """
        positive_keywords = [
            'verfügbar', 'available', 'frei', 'interessiert', 
            'ja', 'yes', 'gerne', 'können'
        ]
        
        negative_keywords = [
            'nicht verfügbar', 'ausgebucht', 'belegt', 'leider nicht',
            'nein', 'no', 'sorry'
        ]
        
        text_lower = response_text.lower()
        
        # Check negative keywords first
        if any(keyword in text_lower for keyword in negative_keywords):
            return False
        
        # Check positive keywords
        if any(keyword in text_lower for keyword in positive_keywords):
            return True
        
        # Default to True (let full analysis determine)
        return True
