import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions


User = get_user_model()


class AdminJWTAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication for Admin panel JWTs.

    Expected header format:
        Authorization: Admin <token>
    """

    keyword = "Admin"

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode("utf-8")

        if not auth_header:
            return None

        try:
            keyword, token = auth_header.split(" ", 1)
        except ValueError:
            # Malformed header
            return None

        if keyword != self.keyword:
            return None

        try:
            # If you later want to strictly enforce audience, remove options
            payload = jwt.decode(
                token,
                settings.ADMIN_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Admin token has expired.")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Invalid admin token.")

        if payload.get("token_type") != "admin":
            raise exceptions.AuthenticationFailed("Not an admin token.")

        user_id = payload.get("sub")
        if not user_id:
            raise exceptions.AuthenticationFailed("Invalid admin token payload.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed("Admin user not found.")

        if not user.is_staff:
            raise exceptions.AuthenticationFailed("User is not admin.")

        return (user, None)


