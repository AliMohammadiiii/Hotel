import jwt
from datetime import datetime, timezone
from django.conf import settings


def create_admin_access_token(user):
    """
    Create a short‑lived Admin panel JWT for the given user.

    This token is intentionally separate from the normal application JWT
    (SimpleJWT) by using a different signing secret and distinct claims.
    """
    now = datetime.now(timezone.utc)
    exp = now + settings.ADMIN_JWT_LIFETIME

    payload = {
        "sub": str(user.id),
        "username": user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "token_type": "admin",   # helps distinguish from normal "access"
        "scope": "admin",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "iss": "hotel-backend-admin",
        "aud": "admin-panel",
    }

    token = jwt.encode(
        payload,
        settings.ADMIN_JWT_SECRET,
        algorithm="HS256",
    )

    # PyJWT 2.x returns str already; keep cast for safety.
    return str(token)


