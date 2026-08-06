"""
AthliTech Core Security Services.

Handles password hashing/verification and JWT token creation/decoding.
"""

from datetime import timedelta
import bcrypt
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer
from jose import JWTError, jwt

from core.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from core.utils import get_utc_now

bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    """
    Hashes a plain text password using bcrypt.

    Args:
        password (str): Plain text password.

    Returns:
        str: Bcrypt hashed password string.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)

    return hashed_password.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a bcrypt hash.

    Args:
        plain_password (str): Plain text password.
        hashed_password (str): Hashed password.

    Returns:
        bool: True if matched, False otherwise.
    """
    plain_password_bytes = plain_password.encode("utf-8")
    hashed_password_bytes = hashed_password.encode("utf-8")

    return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)


def create_access_token(data: dict) -> str:
    """
    Encodes a JWT access token with expiration time.

    Args:
        data (dict): Claims dictionary to encode (must contain 'sub').

    Returns:
        str: Encoded JWT string.
    """
    to_encode = data.copy()
    expire = get_utc_now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def create_refresh_token(data: dict) -> str:
    """
    Encodes a JWT refresh token with extended expiration time.

    Args:
        data (dict): Claims dictionary to encode (must contain 'sub').

    Returns:
        str: Encoded JWT string.
    """
    to_encode = data.copy()
    expire = get_utc_now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_refresh_token(token: str) -> dict:
    """
    Decodes and validates a JWT refresh token.

    Args:
        token (str): JWT string.

    Returns:
        dict: Payload dictionary.

    Raises:
        HTTPException: HTTP 401 if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


def decode_access_token(token: str) -> dict:
    """
    Decodes and validates a JWT access token.

    Args:
        token (str): JWT string.

    Returns:
        dict: Payload dictionary.

    Raises:
        HTTPException: HTTP 401 if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

