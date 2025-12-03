from django.urls import path

from .views import (
    CurrentUserView,
    LogoutView,
    NoteList,
    NoteView,
    RegistrationView,
    TagViewSet,
    UserProfileView,
)

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current_user_profile"),
    path("user/profile/", UserProfileView().as_view(), name="user_profile"),
    path("register/", RegistrationView.as_view(), name="register"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("notes/", NoteList.as_view(), name="notes"),
    path("note/<int:id>/", NoteView.as_view(), name="view_note"),
    path("tags/", TagViewSet.as_view({"get": "list"}), name="tag_read_only"),
]
