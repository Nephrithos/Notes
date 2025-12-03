from django.conf import settings
from rest_framework.authentication import get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import (
    ExpiredTokenError,
    InvalidToken,
    TokenError,
)
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import AccessToken

# from django.middleware.csrf import CsrfViewMiddleware # Not strictly needed here unless you're enforcing CSRF with JWT in cookies, which is complex.


class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication to extract token from HTTP-only cookie.
    This class ensures that if an access token is expired, it raises
    an InvalidToken exception (which DRF will convert to 401).
    The silent refresh is handled by the frontend's Axios interceptor
    calling the /token/refresh/ endpoint.
    """

    def get_token_from_cookie(self, request):
        """
        Extracts the access token from the cookie defined in settings.
        """
        return request.COOKIES.get(settings.SIMPLE_JWT.get("AUTH_COOKIE"))

    def get_raw_token(self, header):
        """
        Overrides the default get_raw_token to prioritize the token from the cookie.
        If no cookie token, it falls back to the Authorization header.
        """
        token = self.get_token_from_cookie(
            self.request
        )  # Access self.request set in authenticate
        if token:
            return token
        # If no cookie token, try to get from Authorization header (for Bearer)
        auth = get_authorization_header(self.request).split()
        if not auth or auth[0].lower() != b"bearer":
            return None  # No Bearer token either

        if len(auth) == 1:
            raise AuthenticationFailed("Invalid token header. No credentials provided.")
        elif len(auth) > 2:
            raise AuthenticationFailed(
                "Invalid token header. Token string should not contain spaces."
            )  # Fallback to Bearer if cookie is empty
        return auth[1].decode("utf-8")

    def get_validated_token(self, raw_token):
        """
        Validates the raw token. If it's invalid (e.g., expired),
        it will raise an InvalidToken exception. DRF converts this to a 401.
        """
        try:
            return AccessToken(raw_token)
        except ExpiredTokenError:
            # Specifically catch ExpiredTokenError and convert to AuthenticationFailed
            # with a message that the frontend can parse if needed.
            raise AuthenticationFailed("Access token has expired.")
        except (InvalidToken, TokenError) as e:
            # Catch other token errors (e.g., malformed, invalid signature)
            raise AuthenticationFailed(f"Invalid token: {e}")

    def authenticate(self, request):
        """
        Authenticates the request by trying to get a token from cookie first,
        then from Authorization header.
        """
        self.request = (
            request  # Store request for use in get_raw_token and get_token_from_cookie
        )

        raw_token = self.get_raw_token(
            None
        )  # Call get_raw_token without passing header, let it find token

        if raw_token is None:
            return None  # No token found in cookie or header

        try:
            validated_token = self.get_validated_token(raw_token)
        except AuthenticationFailed as e:
            # Re-raise AuthenticationFailed; DRF will convert this to a 401 response.
            raise e

        user = self.get_user(validated_token)
        return user, validated_token

    # If you choose to enable CSRF for JWTs in cookies (complex for API-only apps)
    # def enforce_csrf(self, request):
    #     """
    #     Enforce CSRF validation for JWT authentication in cookies.
    #     This is only needed if you specifically require CSRF protection
    #     in addition to JWT (e.g., if you also have session authentication enabled).
    #     For pure JWT API, often not needed unless you're protecting against specific
    #     CSRF attacks that might leverage HttpOnly cookies.
    #     """
    #     check = CsrfViewMiddleware(get_response=lambda r: None)
    #     # populates request._csrf_token
    #     check.process_request(request)
    #     reason = check.process_view(request, None, (), {})
    #     if reason:
    #         # CSRF failed, throw exception
    #         raise exceptions.PermissionDenied('CSRF Failed: %s' % reason)
