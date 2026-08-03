"""
AthliTech Core Utilities.

Provides standard helper functions across core modules.
"""

from datetime import datetime, timezone


def get_utc_now() -> datetime:
    """
    Returns current timezone-aware UTC datetime.
    Replaces deprecated datetime.utcnow() calls.
    
    Returns:
        datetime: Current UTC datetime with timezone.utc set.
    """
    return datetime.now(timezone.utc)
