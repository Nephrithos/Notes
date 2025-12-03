from dataclasses import fields

from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Notes, Tag, UserProfile

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={"input_type": "password"}, write_only=True)

    class Meta:
        model = User
        fields = ["email", "username", "password", "password2"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "username"]
        read_only_fields = ["email", "username"]


class NoteSerializer(serializers.ModelSerializer):
    tags_input = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False,
    )

    tags_display = serializers.SerializerMethodField()

    class Meta:
        model = Notes
        fields = [
            "id",
            "title",
            "content",
            "created_at",
            "updated_at",
            "tags_input",
            "tags_display",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "tags_display"]

    def get_tags_display(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def create(self, validated_data):
        # --- DEBUG PRINT HERE ---
        print("\n--- NoteSerializer CREATE Method ---")
        print(f"Validated data BEFORE pop: {validated_data}")

        tags_data = validated_data.pop(
            "tags_input", []
        )  # This line extracts the tags list

        # --- DEBUG PRINT HERE ---
        print(f"Tags data received for creation: {tags_data}")
        print(f"Validated data AFTER pop (for Note model creation): {validated_data}")
        print("------------------------------------\n")

        user = self.context.get("request").user
        if not user or not user.is_authenticated:
            raise serializers.ValidationError(
                {"user": "Authentication required to create a note."}
            )

        note = Notes.objects.create(user=user, **validated_data)

        for tag_name in tags_data:
            cleaned_tag_name = tag_name.lower().replace(" ", "-")
            tag, created = Tag.objects.get_or_create(name=cleaned_tag_name)
            note.tags.add(tag)

        return note

    def update(self, instance, validated_data):
        # --- DEBUG PRINT HERE ---
        print("\n--- NoteSerializer UPDATE Method ---")
        print(f"Validated data BEFORE pop: {validated_data}")

        tags_data = validated_data.pop("tags_input", None)

        # --- DEBUG PRINT HERE ---
        print(f"Tags data received for update: {tags_data}")
        print(f"Validated data AFTER pop (for Note model update): {validated_data}")
        print("------------------------------------\n")

        instance.title = validated_data.get("title", instance.title)
        instance.content = validated_data.get("content", instance.content)
        instance.save()

        if tags_data is not None:
            instance.tags.clear()
            for tag_name in tags_data:
                cleaned_tag_name = tag_name.lower().replace(" ", "-")
                tag, created = Tag.objects.get_or_create(name=cleaned_tag_name)
                instance.tags.add(tag)

        return instance


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "first_name",
            "last_name",
            "mode_preference",
            "is_profile_setup_completed",
        ]  # Add this field


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "profile"]  # Include 'profile'
        read_only_fields = [
            "username"
        ]  # Username is typically not editable after creation

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})

        # Update core User fields (e.g., email)
        instance.email = validated_data.get("email", instance.email)
        instance.save()

        # Get or create the UserProfile instance
        profile, created = UserProfile.objects.get_or_create(user=instance)

        # Update UserProfile fields
        profile.first_name = profile_data.get("first_name", profile.first_name)
        profile.last_name = profile_data.get("last_name", profile.last_name)
        profile.mode_preference = profile_data.get(
            "mode_preference", profile.mode_preference
        )
        # Update the new flag
        profile.is_profile_setup_completed = profile_data.get(
            "is_profile_setup_completed", profile.is_profile_setup_completed
        )
        profile.save()

        return instance
