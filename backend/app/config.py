from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./bom_system.db"
    SECRET_KEY: str = "mude-esta-chave-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    # Origens permitidas para CORS (separadas por vírgula)
    # Ex: "http://localhost:5173,https://meu-site.github.io"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    class Config:
        env_file = ".env"


settings = Settings()
