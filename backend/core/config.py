from dotenv import load_dotenv
import os
from urllib.parse import quote_plus

load_dotenv()

MONGODB_USERNAME = os.getenv("MONGODB_USERNAME")
MONGODB_PASSWORD = os.getenv("MONGODB_PASSWORD")
MONGODB_CLUSTER = os.getenv("MONGODB_CLUSTER")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "athlitech")
JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY")
SECRET_KEY = JWT_SECRET
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:8081,http://127.0.0.1:8081"
    ).split(",")
    if origin.strip()
]

# Set to "true" in .env for development/demo utilities (e.g. data-reset endpoints)
DEV_MODE: bool = os.getenv("DEV_MODE", "false").lower() == "true"


MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    encoded_username = quote_plus(MONGODB_USERNAME or "")
    encoded_password = quote_plus(MONGODB_PASSWORD or "")
    MONGODB_URI = (
        f"mongodb+srv://{encoded_username}:{encoded_password}@{MONGODB_CLUSTER}/"
        f"?retryWrites=true&w=majority&tls=true"
    )

if not JWT_SECRET:
    raise ValueError("JWT_SECRET is missing. Add it to your .env file.")

if not MONGODB_URI:
    if not MONGODB_USERNAME or not MONGODB_PASSWORD or not MONGODB_CLUSTER:
        raise ValueError("MongoDB connection values are missing. Add MONGODB_URI or MONGODB_USERNAME, MONGODB_PASSWORD, and MONGODB_CLUSTER to your .env file.")
