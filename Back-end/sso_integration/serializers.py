"""
Serializers for Injast SSO integration.
"""
from rest_framework import serializers
from .models import InjastUser


class InjastCallbackSerializer(serializers.Serializer):
    """Serializer for Injast callback endpoint (session code exchange)."""
    session_code = serializers.CharField(
        required=True,
        help_text="One-time session code from Injast SuperApp",
        trim_whitespace=True,  # Automatically trim whitespace
        min_length=20,  # Session codes should be UUID-like (at least 20 chars)
        max_length=100  # Reasonable max length
    )


class InjastUserSerializer(serializers.ModelSerializer):
    """Serializer for InjastUser model."""
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = InjastUser
        fields = [
            'id',
            'user_id',
            'username',
            'email',
            'first_name',
            'last_name',
            'national_id',
            'mobile_number',
            'mobile_country_code',
            'last_synced_at',
            'created_at',
            'updated_at'
        ]
        read_only_fields = fields

