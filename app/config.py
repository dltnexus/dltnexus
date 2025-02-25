from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    # Base paths using Path for cross-platform compatibility
    PROJECT_ROOT: Path = Path(__file__).parent.parent
    DATA_DIR: Path = PROJECT_ROOT / "data"
    MODELS_DIR: Path = PROJECT_ROOT / "models"
    LOGS_DIR: Path = PROJECT_ROOT / "logs"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/dltnexus"
    
    # API
    API_HOST: str = "localhost"
    API_PORT: int = 8000
    
    def initialize_directories(self):
        """Create necessary directories if they don't exist."""
        for directory in [self.DATA_DIR, self.MODELS_DIR, self.LOGS_DIR]:
            directory.mkdir(parents=True, exist_ok=True)
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

# Create global settings instance
settings = Settings()
settings.initialize_directories() 