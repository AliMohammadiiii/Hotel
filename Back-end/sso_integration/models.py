"""
Models for Injast SSO integration.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings


def get_encryption_key():
    """Get or generate encryption key for token storage."""
    try:
        from cryptography.fernet import Fernet
    except ImportError:
        # If cryptography is not installed, return None (encryption will be disabled)
        return None
    
    key = getattr(settings, 'INJAST_TOKEN_ENCRYPTION_KEY', None)
    if not key:
        # Generate a key if not set (for development only)
        key = Fernet.generate_key().decode()
    elif isinstance(key, str):
        key = key.encode()
    return key


class EncryptedTextField(models.TextField):
    """Custom field that encrypts/decrypts data automatically."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        encryption_key = get_encryption_key()
        if encryption_key:
            try:
                from cryptography.fernet import Fernet
                self._cipher = Fernet(encryption_key)
            except ImportError:
                self._cipher = None
        else:
            self._cipher = None
    
    def from_db_value(self, value, expression, connection):
        """Decrypt value when reading from database."""
        if value is None or not self._cipher:
            return value
        try:
            return self._cipher.decrypt(value.encode()).decode()
        except Exception:
            return value  # Return as-is if decryption fails
    
    def get_prep_value(self, value):
        """Encrypt value when saving to database."""
        if value is None or not self._cipher:
            return value
        try:
            return self._cipher.encrypt(value.encode()).decode()
        except Exception:
            return value  # Return as-is if encryption fails


class InjastUser(models.Model):
    """
    Stores Injast SSO user information linked to Django User.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='injast_user',
        verbose_name='Django User'
    )
    national_id = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='National ID',
        help_text='National ID from Injast JWT (nid field)'
    )
    injast_access_token = EncryptedTextField(
        null=True,
        blank=True,
        verbose_name='Injast Access Token',
        help_text='Encrypted Injast JWT access token'
    )
    token_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Token Expires At',
        help_text='When the Injast access token expires'
    )
    mobile_number = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name='Mobile Number'
    )
    mobile_country_code = models.CharField(
        max_length=5,
        null=True,
        blank=True,
        verbose_name='Mobile Country Code',
        default='98'
    )
    last_synced_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Last Synced At',
        help_text='Last time user data was synced from Injast'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Created At'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Updated At'
    )
    
    class Meta:
        verbose_name = 'Injast User'
        verbose_name_plural = 'Injast Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"InjastUser: {self.national_id} ({self.user.username})"
    
    def is_token_expired(self):
        """Check if the stored token is expired."""
        if not self.token_expires_at:
            return True
        return timezone.now() >= self.token_expires_at
