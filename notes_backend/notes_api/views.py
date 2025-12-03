from datetime import datetime, timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.shortcuts import render
from rest_framework import generics, permissions, status, views, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Notes, Tag, UserProfile
from .serializers import UserSerializer  # Your updated UserSerializer
from .serializers import NoteSerializer, TagSerializer, UserRegistrationSerializer

User = get_user_model()


class MyTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            access_token = response.data.get("access")
            refresh_token = response.data.get("refresh")

            access_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE")
            refresh_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE_REFRESH")
            cookie_domain = settings.SIMPLE_JWT.get("AUTH_COOKIE_DOMAIN")
            cookie_secure = settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE")
            cookie_httponly = settings.SIMPLE_JWT.get("AUTH_COOKIE_HTTP_ONLY")
            cookie_samesite = settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE")
            access_token_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME")
            refresh_token_lifetime = settings.SIMPLE_JWT.get("REFRESH_TOKEN_LIFETIME")

            # Set HttpOnly cookies
            response.set_cookie(
                key=access_cookie_name,
                value=access_token,
                expires=access_token_lifetime,  # Access token is short-lived
                secure=cookie_secure,
                httponly=cookie_httponly,
                samesite=cookie_samesite,
                path=settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH"),
                domain=cookie_domain,
            )
            response.set_cookie(
                key=refresh_cookie_name,
                value=refresh_token,
                expires=refresh_token_lifetime,  # Refresh token is longer-lived
                secure=cookie_secure,
                httponly=cookie_httponly,
                samesite=cookie_samesite,
                path=settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH"),
                domain=cookie_domain,
            )

            # Optionally remove tokens from response body if only using cookies
            # response.data = {} # Clear response body data if not needed by frontend
            # Or customize response.data to only send specific info if needed
            response.data = {"message": "Login successful!"}

        return response


class MyTokenRefreshView(TokenRefreshView):
    """
    Custom TokenRefreshView to:
    1. Get the refresh token from an HTTP-only cookie.
    2. Set the new access and refresh tokens as HTTP-only cookies.
    """

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(
            settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"], None
        )

        if not refresh_token:
            # If no refresh token cookie is found, raise an error
            return Response(
                {"detail": "Refresh token cookie not found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Create a serializer instance with the refresh token from the cookie
        serializer = self.get_serializer(data={"refresh": refresh_token})

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            # If refresh token is invalid/expired/blacklisted, raise an InvalidToken error
            # This will result in a 401 response
            raise InvalidToken(e.args[0])

        # Get the new access and (potentially rotated) refresh token from validated data
        access_token = serializer.validated_data.get("access")
        new_refresh_token = serializer.validated_data.get(
            "refresh"
        )  # Only present if ROTATE_REFRESH_TOKENS is True

        response = Response(
            {"detail": "Tokens refreshed successfully."}, status=status.HTTP_200_OK
        )

        # --- Set Access Token Cookie ---
        if settings.SIMPLE_JWT["AUTH_COOKIE"]:
            # Calculate expiration for access token cookie
            access_token_lifetime = settings.SIMPLE_JWT.get(
                "ACCESS_TOKEN_LIFETIME", timedelta(minutes=5)
            )
            access_expiration = datetime.utcnow() + access_token_lifetime
            response.set_cookie(
                key=settings.SIMPLE_JWT["AUTH_COOKIE"],
                value=access_token,
                expires=access_expiration,
                httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
                samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
                secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
                path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
                domain=settings.SIMPLE_JWT["AUTH_COOKIE_DOMAIN"],
            )

        # --- Set Refresh Token Cookie (if rotated) ---
        if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS") and new_refresh_token:
            if settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"]:
                # Calculate expiration for refresh token cookie
                refresh_token_lifetime = settings.SIMPLE_JWT.get(
                    "REFRESH_TOKEN_LIFETIME", timedelta(days=1)
                )
                refresh_expiration = datetime.utcnow() + refresh_token_lifetime
                response.set_cookie(
                    key=settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
                    value=new_refresh_token,
                    expires=refresh_expiration,
                    httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
                    samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
                    secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
                    path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
                    domain=settings.SIMPLE_JWT["AUTH_COOKIE_DOMAIN"],
                )
        elif not settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS") and new_refresh_token:
            # If ROTATE_REFRESH_TOKENS is False, Simple JWT might still return 'refresh'
            # in validated_data if it's the *same* token (or a different one if you
            # have a very custom setup). In a standard HttpOnly setup,
            # you usually don't set the refresh cookie again if it's not rotated.
            # However, if your backend *is* returning a new 'refresh' even without rotation,
            # you might need to handle it. For now, we assume rotation is intended.
            pass

        return response


class RegistrationView(generics.CreateAPIView):

    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        print(request.data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )


class CurrentUserView(APIView):
    """
    View to retrieve the authenticated user's details.
    Requires authentication.
    """

    permission_classes = [
        IsAuthenticated
    ]  # Only authenticated users can access this view

    def get(self, request):
        # request.user is automatically populated by JWTAuthentication
        # if a valid access_token cookie was provided.
        user = request.user
        serializer = UserSerializer(user)  # Serialize the authenticated user object
        return Response(serializer.data, status=status.HTTP_200_OK)


class NoteList(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NoteSerializer

    def get_queryset(self):
        """
        This method is automatically called by DRF's ListCreateAPIView
        to determine the queryset that should be used for listing objects.
        It filters notes to show only those belonging to the authenticated user.
        """
        # `self.request.user` will hold the authenticated user object
        # because `IsAuthenticated` permission class ensures a user is logged in.
        return Notes.objects.filter(user=self.request.user).order_by("-created_at")


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Blacklist refresh token if using token_blacklist
            refresh_token = request.COOKIES.get(
                "refresh_token"
            )  # Get refresh token from cookie
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except (TokenError, InvalidToken):
            # Token was already invalid or missing, no action needed
            pass

        response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

        # Expire/delete the cookies on logout
        response.delete_cookie("access_token")  # Your access token cookie name
        response.delete_cookie("refresh_token")  # Your refresh token cookie name

        # Also expire the cookies if you set a domain/path
        from django.conf import settings

        access_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE")
        refresh_cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE_REFRESH")
        cookie_domain = settings.SIMPLE_JWT.get("AUTH_COOKIE_DOMAIN")
        cookie_path = settings.SIMPLE_JWT.get("AUTH_COOKIE_PATH")

        response.set_cookie(
            key=access_cookie_name,
            value="",
            expires=0,
            secure=settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE"),
            httponly=settings.SIMPLE_JWT.get("AUTH_COOKIE_HTTP_ONLY"),
            samesite=settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE"),
            path=cookie_path,
            domain=cookie_domain,
        )
        response.set_cookie(
            key=refresh_cookie_name,
            value="",
            expires=0,
            secure=settings.SIMPLE_JWT.get("AUTH_COOKIE_SECURE"),
            httponly=settings.SIMPLE_JWT.get("AUTH_COOKIE_HTTP_ONLY"),
            samesite=settings.SIMPLE_JWT.get("AUTH_COOKIE_SAMESITE"),
            path=cookie_path,
            domain=cookie_domain,
        )

        return response


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class NoteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Notes.objects.all()
    serializer_class = NoteSerializer
    lookup_field = "id"
    # lookup_url_kwarg = "id"


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Ensures that a UserProfile instance exists for the current user.
        # This handles cases where a User might exist but their profile hasn't been created yet.
        UserProfile.objects.get_or_create(user=self.request.user)
        return self.request.user
