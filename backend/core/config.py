from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    APP_NAME: str = "MercadoSniper API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",  # Frontend development
        "http://127.0.0.1:3000",
        "https://mercadosniper.vercel.app",  # Production frontend
    ]
    
    # Database Configuration
    DATABASE_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "mercadosniper"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    
    # Scraping Configuration
    SCRAPING_DELAY_MIN: float = 1.5
    SCRAPING_DELAY_MAX: float = 4.0
    SCRAPING_TIMEOUT: int = 15
    SCRAPING_MAX_RETRIES: int = 3
    SCRAPING_CONCURRENT_REQUESTS: int = 5
    
    # MercadoLibre Configuration
    MERCADOLIBRE_BASE_URL: str = "https://carros.mercadolibre.com.co"
    MERCADOLIBRE_ITEMS_PER_PAGE: int = 48
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    
    # Debug Configuration
    DEBUG_SCRAPING: bool = False
    DEBUG_SAVE_HTML: bool = False
    DEBUG_PRINT_RESPONSE: bool = False
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email Configuration (for alerts)
    EMAIL_ENABLED: bool = False
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # Webhook Configuration (for notifications)
    WEBHOOK_ENABLED: bool = False
    WEBHOOK_URL: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Create settings instance
settings = Settings()

# User agents for scraping
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
]

# Browser headers for scraping
BROWSER_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://www.google.com/",
} 