from tabnanny import verbose
from typing import TYPE_CHECKING, Iterable, Optional, Union, override

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _

if TYPE_CHECKING:
    from django.db.models import QuerySet


class Tag(models.Model):
    """
    Represents a tag that can be associated with notes.
    """

    name = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name=_("Tag Name"),
        help_text=_("The unique name of the tag (e.g., 'Python', 'Work')."),
    )

    notes: "models.Manager[Note]"

    class Meta:
        ordering = ["name"]
        verbose_name = _("Tag")
        verbose_name_plural = _("Tags")

    def __str__(self) -> str:
        return self.name


class Notes(models.Model):
    """
    Represents a user's note with a title, content, and optional tags.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notes",
        verbose_name=_("Owner"),
        help_text=_("The user who owns this note."),
    )
    title = models.CharField(
        max_length=100,
        verbose_name=_("Title"),
        help_text=_("The main title of this note."),
    )
    tags = models.ManyToManyField(
        Tag,
        related_name="notes",
        blank=True,
        verbose_name=_("Tags"),
        help_text=_("Tags associated with this note."),
    )
    content = models.CharField(
        max_length=5000,
        verbose_name=_("Content"),
        help_text=_("The main content of the note."),
    )
    created_at: models.DateTimeField = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At"),
        help_text=_("The timestamp when the note was first created."),
    )

    updated_at: models.DateTimeField = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Last Updated At"),
        help_text=_("The timestamp when the note was last updated."),
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Note")
        verbose_name_plural = _("Notes")

    def __str__(self) -> str:
        return self.title


class UserProfile(models.Model):
    THEME_CHOICES = [
        ("light", "Light"),
        ("dark", "Dark"),
        ("system", "System"),  # 'system' means it follows the OS preference
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,  # References the active user model
        on_delete=models.CASCADE,
        related_name="profile",  # Allows user.profile to access this model
        verbose_name="User Profile",
    )
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)

    # Mode Preference field
    mode_preference = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default="system",  # Default theme preference
        blank=True,
        null=True,  # Make it nullable if a user might not have set it explicitly
        help_text="User's preferred theme (light, dark, or system).",
    )
    is_profile_setup_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile for {self.user.username}"


@receiver(post_save, sender=get_user_model())
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
