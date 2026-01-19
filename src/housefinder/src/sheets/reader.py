"""
Google Sheets reader for employee data (Step 0)
Responsible: Denis
"""
import logging
from typing import List, Optional
import gspread
from google.oauth2.service_account import Credentials
from ..models import Employee
from ..config import settings

logger = logging.getLogger(__name__)


class EmployeeSheetReader:
    """Read employee data from Google Sheets"""
    
    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    
    def __init__(self):
        """Initialize Google Sheets client"""
        self.client: Optional[gspread.Client] = None
        self.sheet = None
        
    def connect(self) -> None:
        """Connect to Google Sheets"""
        try:
            creds = Credentials.from_service_account_file(
                settings.GOOGLE_SHEETS_CREDENTIALS_PATH,
                scopes=self.SCOPES
            )
            self.client = gspread.authorize(creds)
            logger.info("Connected to Google Sheets")
        except Exception as e:
            logger.error(f"Failed to connect to Google Sheets: {e}")
            raise
    
    def get_employees(self) -> List[Employee]:
        """
        Read employee data from Mitarbeiter sheet
        
        Expected columns:
        - Employee (Name)
        - Start Date
        - Location
        - ZIP
        - City
        - State
        - Urgent (Yes/No)
        - Budget (optional)
        - Num Persons (optional, default 1)
        
        Returns:
            List of Employee objects
        """
        if not self.client:
            self.connect()
        
        try:
            # Open the spreadsheet and worksheet
            spreadsheet = self.client.open_by_key(settings.GOOGLE_SHEET_ID)
            worksheet = spreadsheet.worksheet(settings.MITARBEITER_SHEET_NAME)
            
            # Get all records as dictionaries
            records = worksheet.get_all_records()
            
            employees = []
            for record in records:
                try:
                    # Map sheet columns to Employee model
                    employee_data = {
                        'name': record.get('Employee', ''),
                        'start_date': record.get('Start Date', ''),
                        'location': record.get('Location', ''),
                        'zip_code': str(record.get('ZIP', '')),
                        'city': record.get('City', ''),
                        'state': record.get('State', ''),
                        'urgent': record.get('Urgent (Yes/No)', 'No'),
                        'budget_max': record.get('Budget') if record.get('Budget') else None,
                        'num_persons': record.get('Num Persons', 1) or 1,
                    }
                    
                    # Skip empty rows
                    if not employee_data['name']:
                        continue
                    
                    employee = Employee(**employee_data)
                    employees.append(employee)
                    logger.info(f"Loaded employee: {employee.name}")
                    
                except Exception as e:
                    logger.error(f"Error parsing employee record: {record}, Error: {e}")
                    continue
            
            logger.info(f"Successfully loaded {len(employees)} employees")
            return employees
            
        except Exception as e:
            logger.error(f"Failed to read employees from sheet: {e}")
            raise
    
    def create_mitarbeiter_sheet_template(self) -> None:
        """
        Create the Mitarbeiter sheet with proper headers
        (Helper function for initial setup)
        """
        if not self.client:
            self.connect()
        
        try:
            spreadsheet = self.client.open_by_key(settings.GOOGLE_SHEET_ID)
            
            # Try to get existing worksheet or create new
            try:
                worksheet = spreadsheet.worksheet(settings.MITARBEITER_SHEET_NAME)
            except gspread.exceptions.WorksheetNotFound:
                worksheet = spreadsheet.add_worksheet(
                    title=settings.MITARBEITER_SHEET_NAME,
                    rows=100,
                    cols=10
                )
            
            # Set headers
            headers = [
                'Employee',
                'Start Date',
                'Location',
                'ZIP',
                'City',
                'State',
                'Urgent (Yes/No)',
                'Budget',
                'Num Persons'
            ]
            worksheet.update('A1:I1', [headers])
            
            # Format headers (bold)
            worksheet.format('A1:I1', {
                'textFormat': {'bold': True},
                'backgroundColor': {'red': 0.9, 'green': 0.9, 'blue': 0.9}
            })
            
            logger.info("Mitarbeiter sheet template created")
            
        except Exception as e:
            logger.error(f"Failed to create sheet template: {e}")
            raise
