"""
Configuration settings for the Housefinder application
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings"""
    
    # Project paths
    BASE_DIR = Path(__file__).parent.parent.parent
    DATA_DIR = BASE_DIR / "data"
    REPORTS_DIR = BASE_DIR / "reports"
    LOGS_DIR = BASE_DIR / "logs"
    CREDENTIALS_DIR = BASE_DIR / "credentials"
    
    # Google Sheets
    GOOGLE_SHEETS_CREDENTIALS_PATH = os.getenv(
        'GOOGLE_SHEETS_CREDENTIALS_PATH', 
        str(CREDENTIALS_DIR / 'google-credentials.json')
    )
    GOOGLE_SHEET_ID = os.getenv('GOOGLE_SHEET_ID', '')
    MITARBEITER_SHEET_NAME = os.getenv('MITARBEITER_SHEET_NAME', 'Mitarbeiter')
    ERGEBNISSE_SHEET_NAME = os.getenv('ERGEBNISSE_SHEET_NAME', 'Ergebnisse')
    
    # Email Configuration
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY', '')
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'housing@step2job.com')
    FROM_NAME = os.getenv('FROM_NAME', 'Step2Job Housing Team')
    
    # WhatsApp Configuration
    WHATSAPP_BUSINESS_ACCOUNT_ID = os.getenv('WHATSAPP_BUSINESS_ACCOUNT_ID', '')
    WHATSAPP_ACCESS_TOKEN = os.getenv('WHATSAPP_ACCESS_TOKEN', '')
    WHATSAPP_PHONE_NUMBER_ID = os.getenv('WHATSAPP_PHONE_NUMBER_ID', '')
    WHATSAPP_WEBHOOK_VERIFY_TOKEN = os.getenv('WHATSAPP_WEBHOOK_VERIFY_TOKEN', '')
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4-turbo-preview')
    
    # Scraping Configuration
    USER_AGENT = os.getenv(
        'USER_AGENT',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    )
    MAX_RADIUS_KM = int(os.getenv('MAX_RADIUS_KM', '35'))
    MIN_RADIUS_KM = int(os.getenv('MIN_RADIUS_KM', '20'))
    DEFAULT_BUDGET_MAX = int(os.getenv('DEFAULT_BUDGET_MAX', '1500'))
    
    # Urgency Configuration
    URGENT_SCRAPING_INTERVAL_HOURS = int(os.getenv('URGENT_SCRAPING_INTERVAL_HOURS', '2'))
    NORMAL_SCRAPING_INTERVAL_HOURS = int(os.getenv('NORMAL_SCRAPING_INTERVAL_HOURS', '24'))
    URGENT_FOLLOWUP_HOURS = int(os.getenv('URGENT_FOLLOWUP_HOURS', '6'))
    NORMAL_FOLLOWUP_HOURS = int(os.getenv('NORMAL_FOLLOWUP_HOURS', '12'))
    
    # Application Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    DEBUG_MODE = os.getenv('DEBUG_MODE', 'False').lower() == 'true'
    
    def __init__(self):
        """Create necessary directories"""
        self.DATA_DIR.mkdir(exist_ok=True)
        self.REPORTS_DIR.mkdir(exist_ok=True)
        self.LOGS_DIR.mkdir(exist_ok=True)
        self.CREDENTIALS_DIR.mkdir(exist_ok=True)

settings = Settings()
