"""
Logging configuration for CoTenWrocław scraping system
"""

import logging
import sys
from datetime import datetime
import os

def setup_logger(name: str, level: str = 'INFO') -> logging.Logger:
    """
    Set up logger with appropriate formatting and handlers
    
    Args:
        name: Logger name
        level: Logging level
        
    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)
    
    # Don't add handlers if they already exist
    if logger.handlers:
        return logger
    
    logger.setLevel(getattr(logging, level.upper()))
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (optional)
    log_dir = os.getenv('LOG_DIR', 'logs')
    if log_dir and os.path.exists(log_dir):
        log_file = os.path.join(log_dir, f'scraping_{datetime.now().strftime("%Y%m%d")}.log')
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger