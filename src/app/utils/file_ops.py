from pathlib import Path
from app.config import settings
import logging

def setup_logging():
    """Configure logging to file and console."""
    log_file = settings.LOGS_DIR / "app.log"
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )

def get_data_file_path(filename: str) -> Path:
    """Get path for a data file."""
    return settings.DATA_DIR / filename

def get_model_file_path(filename: str) -> Path:
    """Get path for a model file."""
    return settings.MODELS_DIR / filename 