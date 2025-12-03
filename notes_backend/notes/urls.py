from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt import views as jwt_views

from notes_api.views import MyTokenObtainPairView, MyTokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls")),
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", MyTokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify", jwt_views.TokenVerifyView.as_view(), name="token_verify"),
    path("", include("notes_api.urls")),
]
