"""
Tests for Injast SSO integration.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch, Mock, MagicMock
from datetime import datetime, timedelta
from django.utils import timezone
import jwt
from .models import InjastUser
from .services import InjastTokenValidator, InjastAPIClient, UserSyncService
from .config import INJAST_BACKEND_URL


class InjastUserModelTest(TestCase):
    """Test InjastUser model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com'
        )
    
    def test_create_injast_user(self):
        """Test creating an InjastUser."""
        injast_user = InjastUser.objects.create(
            user=self.user,
            national_id='0012345678',
            mobile_number='9121234567',
            mobile_country_code='98'
        )
        self.assertEqual(injast_user.national_id, '0012345678')
        self.assertEqual(injast_user.user, self.user)
    
    def test_token_expired(self):
        """Test token expiration check."""
        injast_user = InjastUser.objects.create(
            user=self.user,
            national_id='0012345678'
        )
        # No expiration set
        self.assertTrue(injast_user.is_token_expired())
        
        # Set future expiration
        injast_user.token_expires_at = timezone.now() + timedelta(hours=1)
        injast_user.save()
        self.assertFalse(injast_user.is_token_expired())
        
        # Set past expiration
        injast_user.token_expires_at = timezone.now() - timedelta(hours=1)
        injast_user.save()
        self.assertTrue(injast_user.is_token_expired())


class InjastTokenValidatorTest(TestCase):
    """Test InjastTokenValidator."""
    
    def setUp(self):
        self.validator = InjastTokenValidator()
    
    @patch('sso_integration.services.PyJWKClient')
    def test_validate_token_success(self, mock_jwk_client):
        """Test successful token validation."""
        # Mock JWKS client
        mock_key = MagicMock()
        mock_key.key = "test_key"
        mock_client = MagicMock()
        mock_client.get_signing_key_from_jwt.return_value = mock_key
        mock_jwk_client.return_value = mock_client
        
        # Create a mock token payload
        payload = {
            'nid': '0012345678',
            'mbc': '98',
            'mbn': '9121234567',
            'sub': 'test_sub',
            'iss': f'{INJAST_BACKEND_URL}/',
            'aud': 'sso',
            'exp': int((timezone.now() + timedelta(hours=1)).timestamp()),
            'iat': int(timezone.now().timestamp()),
        }
        
        # Mock jwt.decode to return our payload
        with patch('sso_integration.services.jwt.decode', return_value=payload):
            result = self.validator.validate_token('mock_token')
            self.assertEqual(result['nid'], '0012345678')
    
    @patch('sso_integration.services.PyJWKClient')
    def test_validate_token_expired(self, mock_jwk_client):
        """Test expired token validation."""
        mock_key = MagicMock()
        mock_key.key = "test_key"
        mock_client = MagicMock()
        mock_client.get_signing_key_from_jwt.return_value = mock_key
        mock_jwk_client.return_value = mock_client
        
        with patch('sso_integration.services.jwt.decode', side_effect=jwt.ExpiredSignatureError()):
            with self.assertRaises(ValueError) as context:
                self.validator.validate_token('expired_token')
            self.assertIn('expired', str(context.exception).lower())


class InjastAPIClientTest(TestCase):
    """Test InjastAPIClient."""
    
    def setUp(self):
        self.client = InjastAPIClient()
    
    @patch('sso_integration.services.requests.post')
    def test_exchange_session_code_success(self, mock_post):
        """Test successful session code exchange."""
        mock_response = Mock()
        mock_response.json.return_value = {
            'meta': {'success': True},
            'data': {'access_token': 'test_access_token'}
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        token = self.client.exchange_session_code('test_session_code')
        self.assertEqual(token, 'test_access_token')
    
    @patch('sso_integration.services.requests.post')
    def test_exchange_session_code_failure(self, mock_post):
        """Test failed session code exchange."""
        mock_response = Mock()
        mock_response.json.return_value = {
            'meta': {'success': False, 'error_code': 'InvalidSessionCode'},
            'message': 'Session code is invalid'
        }
        mock_response.raise_for_status = Mock()
        mock_post.return_value = mock_response
        
        with self.assertRaises(ValueError) as context:
            self.client.exchange_session_code('invalid_code')
        self.assertIn('error', str(context.exception).lower())
    
    @patch('sso_integration.services.requests.get')
    def test_get_user_basic_success(self, mock_get):
        """Test successful user basic data fetch."""
        mock_response = Mock()
        mock_response.json.return_value = {
            'meta': {'success': True},
            'data': {
                'national_id': '0012345678',
                'first_name': 'Test',
                'last_name': 'User',
                'email': 'test@example.com',
                'mobile_number': '9121234567',
                'mobile_country_code': '98'
            }
        }
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response
        
        user_data = self.client.get_user_basic('test_token')
        self.assertEqual(user_data['national_id'], '0012345678')
        self.assertEqual(user_data['first_name'], 'Test')


class UserSyncServiceTest(TestCase):
    """Test UserSyncService."""
    
    def setUp(self):
        self.sync_service = UserSyncService()
    
    @patch('sso_integration.services.InjastAPIClient.get_user_basic')
    @patch('sso_integration.services.InjastTokenValidator.validate_token')
    @patch('sso_integration.services.InjastAPIClient.exchange_session_code')
    def test_create_new_user(self, mock_exchange, mock_validate, mock_get_user):
        """Test creating a new user from Injast data."""
        # Mock API responses
        mock_exchange.return_value = 'test_access_token'
        mock_validate.return_value = {
            'nid': '0012345678',
            'mbc': '98',
            'mbn': '9121234567',
            'exp': int((timezone.now() + timedelta(hours=1)).timestamp()),
        }
        mock_get_user.return_value = {
            'national_id': '0012345678',
            'first_name': 'Test',
            'last_name': 'User',
            'email': 'test@example.com',
            'mobile_number': '9121234567',
            'mobile_country_code': '98'
        }
        
        user = self.sync_service.create_or_update_user(
            injast_data=mock_get_user.return_value,
            access_token='test_token',
            token_payload=mock_validate.return_value
        )
        
        self.assertIsNotNone(user)
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertTrue(InjastUser.objects.filter(national_id='0012345678').exists())
    
    @patch('sso_integration.services.InjastAPIClient.get_user_basic')
    @patch('sso_integration.services.InjastTokenValidator.validate_token')
    def test_update_existing_user(self, mock_validate, mock_get_user):
        """Test updating an existing user."""
        # Create existing user
        existing_user = User.objects.create_user(
            username='injast_0012345678',
            email='old@example.com',
            first_name='Old',
            last_name='Name'
        )
        InjastUser.objects.create(
            user=existing_user,
            national_id='0012345678'
        )
        
        # Mock API responses
        mock_validate.return_value = {
            'nid': '0012345678',
            'exp': int((timezone.now() + timedelta(hours=1)).timestamp()),
        }
        mock_get_user.return_value = {
            'national_id': '0012345678',
            'first_name': 'New',
            'last_name': 'Name',
            'email': 'new@example.com',
            'mobile_number': '9121234567',
            'mobile_country_code': '98'
        }
        
        user = self.sync_service.create_or_update_user(
            injast_data=mock_get_user.return_value,
            access_token='test_token',
            token_payload=mock_validate.return_value
        )
        
        self.assertEqual(user.id, existing_user.id)
        self.assertEqual(user.first_name, 'New')
        self.assertEqual(user.email, 'new@example.com')
        # Should still be only one InjastUser
        self.assertEqual(InjastUser.objects.filter(national_id='0012345678').count(), 1)
