"""
Recommendation Engine (Step 7)
Responsible: Denis + ChatGPT
Ranks and recommends best accommodation options
"""
import logging
from typing import List, Tuple
import openai
from ..models import AccommodationResult, Employee
from ..config import settings

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Generate recommendations for accommodation"""
    
    def __init__(self):
        """Initialize OpenAI client"""
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
        else:
            logger.warning("OpenAI API key not configured")
    
    def rank_results(
        self, 
        results: List[AccommodationResult],
        employee: Employee
    ) -> List[AccommodationResult]:
        """
        Rank accommodation results
        
        Ranking criteria:
        1. Availability (must be available)
        2. Distance (closer is better)
        3. Price (within budget)
        4. Amenities (internet, parking)
        5. Urgency factor (for urgent cases, prioritize speed)
        
        Args:
            results: List of AccommodationResult objects
            employee: Employee requiring accommodation
            
        Returns:
            Sorted list with top 3 marked
        """
        logger.info(f"Ranking {len(results)} results for {employee.name}")
        
        # Filter available only
        available = [r for r in results if r.verfuegbar and r.verfuegbar.lower() in ['ja', 'yes']]
        
        if not available:
            logger.warning(f"No available accommodations found for {employee.name}")
            return results
        
        # Calculate score for each result
        scored_results = []
        for result in available:
            score = self._calculate_score(result, employee)
            result.warnings = self._generate_warnings(result, employee)
            scored_results.append((score, result))
        
        # Sort by score (descending)
        scored_results.sort(key=lambda x: x[0], reverse=True)
        
        # Mark top 3
        ranked_results = []
        for i, (score, result) in enumerate(scored_results):
            if i < 3:
                result.rank = i + 1
            ranked_results.append(result)
        
        # Add unavailable at the end
        unavailable = [r for r in results if r not in available]
        for result in unavailable:
            result.warnings = "Nicht verfügbar"
        
        ranked_results.extend(unavailable)
        
        logger.info(f"Ranked results - Top 3: {[r.adresse_unterkunft for r in ranked_results[:3]]}")
        
        return ranked_results
    
    def _calculate_score(
        self, 
        result: AccommodationResult,
        employee: Employee
    ) -> float:
        """
        Calculate score for a result
        
        Args:
            result: AccommodationResult
            employee: Employee
            
        Returns:
            Score (higher is better)
        """
        score = 100.0
        
        # Distance score (closer is better)
        if result.entfernung_km:
            try:
                distance = float(result.entfernung_km.split()[0])  # Extract number
                if distance <= 10:
                    score += 30
                elif distance <= 20:
                    score += 20
                elif distance <= 30:
                    score += 10
                else:
                    score -= 10  # Too far
            except:
                pass
        
        # Price score (within budget is better)
        if result.preis_monat:
            try:
                price = float(result.preis_monat.replace('€', '').replace(',', '.').split()[0])
                budget = employee.budget_max or settings.DEFAULT_BUDGET_MAX
                
                if price <= budget * 0.8:
                    score += 20  # Well within budget
                elif price <= budget:
                    score += 10  # Within budget
                else:
                    score -= 20  # Over budget
            except:
                pass
        
        # Amenities score
        if result.internet and result.internet.lower() in ['ja', 'yes']:
            score += 5
        
        if result.parkplatz and result.parkplatz.lower() in ['ja', 'yes']:
            score += 5
        
        # Urgency bonus (for urgent cases, give slight preference)
        if employee.urgent:
            score += 5
        
        return score
    
    def _generate_warnings(
        self, 
        result: AccommodationResult,
        employee: Employee
    ) -> str:
        """
        Generate warnings for a result
        
        Args:
            result: AccommodationResult
            employee: Employee
            
        Returns:
            Warning message or empty string
        """
        warnings = []
        
        # Check distance
        if result.entfernung_km:
            try:
                distance = float(result.entfernung_km.split()[0])
                if distance > 30:
                    warnings.append(f"Zu weit entfernt: {distance}km")
            except:
                pass
        
        # Check price
        if result.preis_monat:
            try:
                price = float(result.preis_monat.replace('€', '').replace(',', '.').split()[0])
                budget = employee.budget_max or settings.DEFAULT_BUDGET_MAX
                
                if price > budget:
                    warnings.append(f"Über Budget: €{price} > €{budget}")
            except:
                pass
        
        # Check amenities
        if result.internet and result.internet.lower() in ['nein', 'no']:
            warnings.append("Kein Internet")
        
        if result.parkplatz and result.parkplatz.lower() in ['nein', 'no']:
            warnings.append("Kein Parkplatz")
        
        return "; ".join(warnings)
    
    def generate_summary(
        self, 
        results: List[AccommodationResult],
        employee: Employee
    ) -> str:
        """
        Generate management summary using GPT
        
        Args:
            results: Ranked list of AccommodationResult objects
            employee: Employee requiring accommodation
            
        Returns:
            Summary text
        """
        if not settings.OPENAI_API_KEY:
            return self._generate_simple_summary(results, employee)
        
        try:
            # Get top 3 results
            top_3 = [r for r in results if r.rank and r.rank <= 3]
            
            # Prepare data for GPT
            results_text = ""
            for result in top_3:
                results_text += f"""
Option {result.rank}:
- Adresse: {result.adresse_unterkunft or 'N/A'}
- Preis: {result.preis_monat or 'N/A'}
- Entfernung: {result.entfernung_km or 'N/A'}
- Internet: {result.internet or 'N/A'}
- Parkplatz: {result.parkplatz or 'N/A'}
- Warnungen: {result.warnings or 'Keine'}
- Bemerkung: {result.bemerkung or 'N/A'}
"""
            
            prompt = f"""Erstelle eine professionelle Zusammenfassung für das Management über die besten Unterkunftsoptionen.

Mitarbeiter: {employee.name}
Standort: {employee.location}
Start: {employee.start_date.strftime('%d.%m.%Y')}
Dringend: {'Ja' if employee.urgent else 'Nein'}

Top 3 Optionen:
{results_text}

Erstelle eine kurze, klare Zusammenfassung mit:
1. Empfehlung der besten Option
2. Hauptvorteile
3. Eventuelle Bedenken
4. Nächste Schritte"""
            
            response = openai.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Du bist ein professioneller Assistent für Unterkunftsverwaltung."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            summary = response.choices[0].message.content
            logger.info(f"Generated summary for {employee.name}")
            return summary
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return self._generate_simple_summary(results, employee)
    
    def _generate_simple_summary(
        self, 
        results: List[AccommodationResult],
        employee: Employee
    ) -> str:
        """Generate simple summary without GPT"""
        top_3 = [r for r in results if r.rank and r.rank <= 3]
        
        summary = f"Unterkunftssuche für {employee.name}\n"
        summary += f"Standort: {employee.location}\n"
        summary += f"Start: {employee.start_date.strftime('%d.%m.%Y')}\n\n"
        
        if not top_3:
            summary += "⚠️ Keine verfügbaren Unterkünfte gefunden.\n"
        else:
            summary += f"✓ {len(top_3)} verfügbare Optionen gefunden:\n\n"
            
            for result in top_3:
                summary += f"Option {result.rank}:\n"
                summary += f"  Adresse: {result.adresse_unterkunft or 'N/A'}\n"
                summary += f"  Preis: {result.preis_monat or 'N/A'}\n"
                summary += f"  Entfernung: {result.entfernung_km or 'N/A'}\n"
                if result.warnings:
                    summary += f"  ⚠️ {result.warnings}\n"
                summary += "\n"
        
        return summary
