"""
Services for Injast SSO integration.
Handles token validation, API communication, and user synchronization.
"""
import jwt
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.cache import cache
from .config import (
    INJAST_JWKS_URL,
    INJAST_EXCHANGE_SESSION_CODE_URL,
    INJAST_USER_BASIC_URL,
    INJAST_USER_BANKING_URL,
    INJAST_JWT_AUDIENCE,
    INJAST_JWT_ALGORITHM,
    INJAST_JWKS_CACHE_TTL,
    INJAST_BACKEND_URL,
    INJAST_API_KEY,
    INJAST_API_SECRET
)
from .models import InjastUser

logger = logging.getLogger(__name__)


class InjastTokenValidator:
    """Validates Injast JWT tokens using JWKS."""
    
    CACHE_KEY_PREFIX = 'injast_jwks_'
    
    def __init__(self):
        self.jwks_url = INJAST_JWKS_URL
        self.audience = INJAST_JWT_AUDIENCE
        self.algorithm = INJAST_JWT_ALGORITHM
    
    def get_jwks(self) -> Dict[str, Any]:
        """Fetch JWKS from Injast backend with caching."""
        cache_key = f"{self.CACHE_KEY_PREFIX}keys"
        jwks = cache.get(cache_key)
        
        if jwks is None:
            try:
                response = requests.get(self.jwks_url, timeout=10)
                response.raise_for_status()
                jwks = response.json()
                # Cache for the configured TTL
                cache.set(cache_key, jwks, INJAST_JWKS_CACHE_TTL)
                logger.info(f"Fetched JWKS from {self.jwks_url}")
            except requests.RequestException as e:
                logger.error(f"Failed to fetch JWKS: {e}")
                raise ValueError(f"Failed to fetch JWKS: {e}")
        
        return jwks
    
    def get_signing_key(self, token: str) -> Any:
        """Get the appropriate signing key from JWKS for the token."""
        from jwt import PyJWKClient
        
        try:
            jwks_client = PyJWKClient(self.jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            return signing_key.key
        except Exception as e:
            logger.error(f"Failed to get signing key: {e}")
            raise ValueError(f"Failed to get signing key: {e}")
    
    def validate_token(self, token: str) -> Dict[str, Any]:
        """
        Validate Injast JWT token.
        Returns decoded payload if valid, raises exception if invalid.
        """
        try:
            # Get signing key from JWKS
            signing_key = self.get_signing_key(token)
            
            # Decode and validate token
            # Handle audience as list or string
            audience_check = self.audience
            if isinstance(audience_check, str):
                audience_check = [audience_check]
            
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=[self.algorithm],
                audience=audience_check,
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_aud": True,
                    "verify_iss": False,  # Make issuer optional
                }
            )
            
            # Additional validation: check issuer if present
            if 'iss' in payload:
                expected_issuer = INJAST_BACKEND_URL.rstrip('/') + '/'
                if not payload['iss'].startswith(INJAST_BACKEND_URL.rstrip('/')):
                    logger.warning(f"Token issuer mismatch: {payload['iss']} vs {expected_issuer}")
            
            # Log with uid or nid (handle both formats)
            identifier = payload.get('uid') or payload.get('nid') or payload.get('sub')
            logger.info(f"Token validated successfully for user: {identifier}")
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            raise ValueError("Token has expired")
        except jwt.InvalidAudienceError:
            logger.error(f"Invalid audience. Expected: {self.audience}")
            raise ValueError(f"Invalid token audience")
        except jwt.InvalidSignatureError:
            logger.error("Invalid token signature")
            raise ValueError("Invalid token signature")
        except jwt.DecodeError as e:
            logger.error(f"Token decode error: {e}")
            raise ValueError(f"Invalid token format: {e}")
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            raise ValueError(f"Token validation failed: {e}")


class InjastAPIClient:
    """HTTP client for communicating with Injast backend APIs."""
    
    def __init__(self):
        self.exchange_url = INJAST_EXCHANGE_SESSION_CODE_URL
        self.user_basic_url = INJAST_USER_BASIC_URL
        self.user_banking_url = INJAST_USER_BANKING_URL
        self.timeout = 30
    
    def exchange_session_code(self, session_code: str) -> str:
        """
        Exchange session code for Injast access token.
        Returns the access token string.
        
        Note: According to spec, backend-to-backend access is IP whitelisted.
        If you get 401 errors, your server IP may need to be whitelisted by Injast.
        """
        # Build headers - add API key if configured
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        # Add API key authentication if provided
        if INJAST_API_KEY:
            headers['X-API-Key'] = INJAST_API_KEY
        if INJAST_API_SECRET:
            headers['X-API-Secret'] = INJAST_API_SECRET
        
        try:
            logger.info(f"Exchanging session code at {self.exchange_url}")
            logger.info(f"Session code length: {len(session_code)}")
            logger.info(f"Session code (first 30 chars): {session_code[:30]}...")
            logger.debug(f"Request headers: {headers}")
            logger.debug(f"Request body: {{'session_code': '{session_code[:20]}...'}}")
            
            # Try JSON format first (per spec)
            response = requests.post(
                self.exchange_url,
                json={'session_code': session_code},
                timeout=self.timeout,
                headers=headers
            )
            
            logger.debug(f"Response status: {response.status_code}")
            logger.debug(f"Response headers: {dict(response.headers)}")
            
            # Log detailed error information for 401
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    error_code = error_data.get('meta', {}).get('error_code', 'Unauthorized')
                    error_message = error_data.get('message', 'Unauthorized')
                    logger.error(f"401 Unauthorized: {error_code} - {error_message}")
                    
                    # Check if it's an InvalidToken error (session code issue)
                    if 'InvalidToken' in error_code or 'توکن' in error_message:
                        logger.error("⚠️  Session code validation failed:")
                        logger.error("   1. Session code may be invalid or expired (15min TTL)")
                        logger.error("   2. Session code may have already been used (one-time use)")
                        logger.error("   3. Session code format may be incorrect")
                    else:
                        logger.error("⚠️  This usually means:")
                        logger.error("   1. Your server IP is not whitelisted by Injast")
                        logger.error("   2. API key/authentication is missing or incorrect")
                        logger.error("   3. Session code is invalid or expired")
                except:
                    logger.error(f"401 Unauthorized: {response.text[:200]}")
            
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('meta', {}).get('success', False):
                error_code = data.get('meta', {}).get('error_code', 'UnknownError')
                error_message = data.get('message', 'Unknown error')
                logger.error(f"Session code exchange failed: {error_code} - {error_message}")
                raise ValueError(f"Injast API error: {error_message}")
            
            access_token = data.get('data', {}).get('access_token')
            if not access_token:
                logger.error("No access token in response")
                raise ValueError("No access token received from Injast")
            
            logger.info("Session code exchanged successfully")
            return access_token
            
        except requests.HTTPError as e:
            if e.response.status_code == 401:
                logger.error("401 Unauthorized - Server IP may need to be whitelisted by Injast")
                raise ValueError("Unauthorized: Your server IP may need to be whitelisted by Injast. Contact Injast support.")
            logger.error(f"HTTP error during session code exchange: {e}")
            raise ValueError(f"Failed to exchange session code: {e}")
        except requests.RequestException as e:
            logger.error(f"Network error during session code exchange: {e}")
            raise ValueError(f"Failed to exchange session code: {e}")
    
    def get_user_basic(self, access_token: str) -> Dict[str, Any]:
        """
        Fetch user basic information from Injast.
        Returns user data dictionary with name, email, etc.
        This is CRITICAL for getting user name information.
        """
        # Try multiple formats to get name data
        auth_formats = [
            access_token,  # Token only (per spec)
            f'Bearer {access_token}',  # With Bearer prefix
        ]
        
        last_error = None
        
        for auth_header in auth_formats:
            try:
                response = requests.get(
                    self.user_basic_url,
                    headers={
                        'Authorization': auth_header,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout=self.timeout
                )
            
                # Log response details for debugging
                if response.status_code != 200:
                    try:
                        error_data = response.json()
                        error_code = error_data.get('meta', {}).get('error_code', 'Unknown')
                        logger.warning(f"API returned {response.status_code}: {error_code} (format: {'Bearer' if 'Bearer' in auth_header else 'Token only'})")
                        logger.debug(f"Full error response: {error_data}")
                    except:
                        logger.warning(f"API returned {response.status_code}: {response.text[:200]}")
                    last_error = f"HTTP {response.status_code}"
                    continue  # Try next format
                
                response.raise_for_status()
                
                data = response.json()
                
                if not data.get('meta', {}).get('success', False):
                    error_code = data.get('meta', {}).get('error_code', 'UnknownError')
                    error_message = data.get('message', 'Unknown error')
                    logger.error(f"Get user basic failed: {error_code} - {error_message}")
                    last_error = f"{error_code}: {error_message}"
                    continue  # Try next format
                
                user_data = data.get('data', {})
                if not user_data:
                    logger.error("No user data in response")
                    last_error = "No user data in response"
                    continue  # Try next format
                
                # Check if we got name information
                has_name = user_data.get('first_name') or user_data.get('last_name')
                if has_name:
                    logger.info(f"✓ User data fetched with name: {user_data.get('first_name')} {user_data.get('last_name')}")
                else:
                    logger.warning("⚠️  User data fetched but missing name fields")
                
                logger.info(f"User basic data fetched for nid: {user_data.get('national_id')}")
                return user_data
                
            except requests.RequestException as e:
                logger.warning(f"Network error with format {'Bearer' if 'Bearer' in auth_header else 'Token only'}: {e}")
                last_error = str(e)
                continue  # Try next format
        
        # All formats failed
        logger.error(f"❌ Failed to fetch user data after trying all formats. Last error: {last_error}")
        logger.error("⚠️  WARNING: User name and email will NOT be available without API data")
        raise ValueError(f"Failed to fetch user data: {last_error}")
    
    def get_user_banking(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Fetch user banking information from Injast (optional).
        Returns banking data dictionary or None if not available.
        """
        try:
            # Try both formats: with and without Bearer prefix
            auth_header = access_token
            if not access_token.startswith('Bearer '):
                auth_header = f'Bearer {access_token}'
            
            response = requests.get(
                self.user_banking_url,
                headers={
                    'Authorization': auth_header,
                    'Content-Type': 'application/json'
                },
                timeout=self.timeout
            )
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('meta', {}).get('success', False):
                # Banking info might not be available, so we log but don't raise
                logger.warning(f"Get user banking failed: {data.get('message', 'Unknown error')}")
                return None
            
            return data.get('data', {})
            
        except requests.RequestException as e:
            logger.warning(f"Network error during get user banking: {e}")
            return None


class UserSyncService:
    """Service for syncing Injast user data to Django User."""
    
    def __init__(self):
        self.token_validator = InjastTokenValidator()
        self.api_client = InjastAPIClient()
    
    def create_or_update_user(
        self,
        injast_data: Dict[str, Any],
        access_token: str,
        token_payload: Optional[Dict[str, Any]] = None
    ) -> User:
        """
        Create or update Django User from Injast data.
        Uses national_id (nid/uid) as unique identifier for idempotency.
        """
        # Get national_id from data or token payload (handle both nid and uid)
        national_id = (
            injast_data.get('national_id') or 
            (token_payload and token_payload.get('nid')) or
            (token_payload and token_payload.get('uid'))
        )
        
        if not national_id:
            raise ValueError("National ID (nid/uid) is required")
        
        # Calculate token expiration from payload if available
        token_expires_at = None
        if token_payload and 'exp' in token_payload:
            from datetime import timezone as dt_timezone
            token_expires_at = datetime.fromtimestamp(token_payload['exp'], tz=dt_timezone.utc)
        
        # Try to find existing InjastUser by national_id
        try:
            injast_user = InjastUser.objects.get(national_id=national_id)
            user = injast_user.user
            is_new_user = False
            logger.info(f"Found existing user for national_id: {national_id}")
        except InjastUser.DoesNotExist:
            # Create new user
            # Use national_id as username (or generate unique username)
            username = f"injast_{national_id}"
            # Ensure username is unique
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"injast_{national_id}_{counter}"
                counter += 1
            
            # Create Django User
            user = User.objects.create_user(
                username=username,
                email=injast_data.get('email', ''),
                first_name=injast_data.get('first_name', ''),
                last_name=injast_data.get('last_name', ''),
                is_active=True
            )
            
            # Create InjastUser
            injast_user = InjastUser.objects.create(
                user=user,
                national_id=national_id
            )
            is_new_user = True
            logger.info(f"Created new user for national_id: {national_id}")
        
        # Update user fields from Injast data
        # Name fields are important - update them if available
        if injast_data.get('email'):
            user.email = injast_data.get('email')
        if injast_data.get('first_name'):
            user.first_name = injast_data.get('first_name')
        elif user.first_name:  # Keep existing if new one not available
            pass
        if injast_data.get('last_name'):
            user.last_name = injast_data.get('last_name')
        elif user.last_name:  # Keep existing if new one not available
            pass
        user.save()
        
        # Update InjastUser fields
        injast_user.injast_access_token = access_token
        injast_user.token_expires_at = token_expires_at
        injast_user.mobile_number = injast_data.get('mobile_number') or (token_payload and token_payload.get('mbn'))
        injast_user.mobile_country_code = injast_data.get('mobile_country_code') or (token_payload and token_payload.get('mbc')) or '98'
        injast_user.last_synced_at = timezone.now()
        injast_user.save()
        
        logger.info(f"User synced successfully: {user.username} (national_id: {national_id})")
        return user

