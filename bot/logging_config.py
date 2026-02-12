import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(log_file="logs/trading_bot.log"):
    """
    Sets up logging configuration.
    Logs are written to a file and optionally to the console (if needed, but sticking to file as per req).
    """
    # Create logs directory if it doesn't exist
    log_dir = os.path.dirname(log_file)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)

    logger = logging.getLogger("trading_bot")
    logger.setLevel(logging.DEBUG)

    # Create formatters
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # File Handler
    file_handler = RotatingFileHandler(log_file, maxBytes=5*1024*1024, backupCount=5)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    # Avoid adding multiple handlers if setup is called multiple times
    if not logger.handlers:
        logger.addHandler(file_handler)

    # Also capture python-binance logs
    binance_logger = logging.getLogger("binance")
    binance_logger.setLevel(logging.INFO)
    if not binance_logger.handlers:
        binance_logger.addHandler(file_handler)
        
    return logger
