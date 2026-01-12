"""
Structured Logging Configuration
JSON and text format support with request correlation
"""
import sys
import logging
from loguru import logger
from typing import Any
import json
from datetime import datetime

from app.core.config import get_settings

settings = get_settings()


class InterceptHandler(logging.Handler):
    """Intercept standard logging and redirect to loguru."""
    
    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


class JSONFormatter:
    """Format logs as JSON for production."""
    
    def __call__(self, record: dict) -> str:
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record["level"].name,
            "message": record["message"],
            "module": record["name"],
            "function": record["function"],
            "line": record["line"],
        }
        
        # Add extra fields
        if record.get("extra"):
            log_record.update(record["extra"])
        
        # Add exception info
        if record.get("exception"):
            log_record["exception"] = str(record["exception"])
        
        return json.dumps(log_record) + "\n"


def setup_logging():
    """Configure application logging."""
    
    # Remove default handlers
    logger.remove()
    
    # Determine format based on environment
    if settings.LOG_FORMAT == "json":
        format_func = JSONFormatter()
        logger.add(
            sys.stdout,
            format=format_func,
            level=settings.LOG_LEVEL,
            serialize=False
        )
    else:
        # Text format for development
        logger.add(
            sys.stdout,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                   "<level>{level: <8}</level> | "
                   "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
                   "<level>{message}</level>",
            level=settings.LOG_LEVEL,
            colorize=True
        )
    
    # Intercept standard logging
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Silence noisy loggers
    for logger_name in ["uvicorn", "uvicorn.error", "uvicorn.access"]:
        logging_logger = logging.getLogger(logger_name)
        logging_logger.handlers = [InterceptHandler()]
    
    logger.info("Logging configured", extra={"format": settings.LOG_FORMAT})


def get_logger(name: str):
    """Get a logger with the given name."""
    return logger.bind(name=name)
