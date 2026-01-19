"""
Google Sheets writer for results (Step 6)
Responsible: Emir
"""
import logging
from typing import List
import gspread
from google.oauth2.service_account import Credentials
from ..models import AccommodationResult
from ..config import settings

logger = logging.getLogger(__name__)


class ResultsSheetWriter:
    """Write accommodation results to Google Sheets"""
    
    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    
    def __init__(self):
        """Initialize Google Sheets client"""
        self.client = None
        self.worksheet = None
        
    def connect(self) -> None:
        """Connect to Google Sheets"""
        try:
            creds = Credentials.from_service_account_file(
                settings.GOOGLE_SHEETS_CREDENTIALS_PATH,
                scopes=self.SCOPES
            )
            self.client = gspread.authorize(creds)
            logger.info("Connected to Google Sheets for writing")
        except Exception as e:
            logger.error(f"Failed to connect to Google Sheets: {e}")
            raise
    
    def create_results_sheet(self) -> None:
        """
        Create the Ergebnisse sheet with proper headers
        Must be called before writing results
        """
        if not self.client:
            self.connect()
        
        try:
            spreadsheet = self.client.open_by_key(settings.GOOGLE_SHEET_ID)
            
            # Try to get existing worksheet or create new
            try:
                self.worksheet = spreadsheet.worksheet(settings.ERGEBNISSE_SHEET_NAME)
                logger.info("Found existing Ergebnisse sheet")
            except gspread.exceptions.WorksheetNotFound:
                self.worksheet = spreadsheet.add_worksheet(
                    title=settings.ERGEBNISSE_SHEET_NAME,
                    rows=1000,
                    cols=25
                )
                logger.info("Created new Ergebnisse sheet")
            
            # Set headers
            headers = AccommodationResult.get_sheet_headers()
            self.worksheet.update('A1', [headers])
            
            # Format headers (bold, background color)
            self.worksheet.format('A1:Y1', {
                'textFormat': {'bold': True},
                'backgroundColor': {'red': 0.2, 'green': 0.6, 'blue': 0.9},
                'textFormat': {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}}
            })
            
            # Freeze header row
            self.worksheet.freeze(rows=1)
            
            logger.info("Results sheet configured with headers")
            
        except Exception as e:
            logger.error(f"Failed to create results sheet: {e}")
            raise
    
    def write_result(self, result: AccommodationResult) -> None:
        """
        Write a single accommodation result to the sheet
        
        Args:
            result: AccommodationResult object to write
        """
        if not self.worksheet:
            self.create_results_sheet()
        
        try:
            # Convert result to row format
            row_data = result.to_sheet_row()
            
            # Append to sheet
            self.worksheet.append_row(row_data)
            
            logger.info(f"Wrote result for employee: {result.employee_name}")
            
        except Exception as e:
            logger.error(f"Failed to write result: {e}")
            raise
    
    def write_results(self, results: List[AccommodationResult]) -> None:
        """
        Write multiple accommodation results to the sheet
        
        Args:
            results: List of AccommodationResult objects
        """
        if not self.worksheet:
            self.create_results_sheet()
        
        try:
            # Convert all results to rows
            rows_data = [result.to_sheet_row() for result in results]
            
            # Batch append to sheet for efficiency
            if rows_data:
                self.worksheet.append_rows(rows_data)
                logger.info(f"Wrote {len(results)} results to sheet")
            
        except Exception as e:
            logger.error(f"Failed to write results: {e}")
            raise
    
    def clear_results(self) -> None:
        """Clear all results (keeping headers)"""
        if not self.worksheet:
            self.create_results_sheet()
        
        try:
            # Clear all rows except header
            self.worksheet.delete_rows(2, self.worksheet.row_count)
            logger.info("Cleared results sheet")
        except Exception as e:
            logger.error(f"Failed to clear results: {e}")
            raise
