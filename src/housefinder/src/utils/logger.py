"""
Logging configuration
"""
import logging
import sys
from pathlib import Path
from ..config import settings


def setup_logger(name: str = None, log_file: str = None) -> logging.Logger:
    """
    Setup logger with console and file handlers
    
    Args:
        name: Logger name (default: root logger)
        log_file: Log file name (default: housefinder.log)
        
    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)
    
    # Set level from settings
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(level)
    
    # Remove existing handlers
    logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler
    if log_file is None:
        log_file = "housefinder.log"
    
    log_path = settings.LOGS_DIR / log_file
    file_handler = logging.FileHandler(log_path, encoding='utf-8')
    file_handler.setLevel(level)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)
    
    return logger
