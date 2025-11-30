"""
Views for Injast SSO integration.
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import InjastCallbackSerializer, InjastUserSerializer
from .services import InjastAPIClient, InjastTokenValidator, UserSyncService
from .models import InjastUser

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def injast_callback_view(request):
    """
    Handle Injast SSO callback.
    Receives session code, exchanges for token, syncs user, returns local JWT.
    """
    serializer = InjastCallbackSerializer(data=request.data)
    
    if not serializer.is_valid():
        logger.error(f"Invalid request data: {request.data}")
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(
            {
                'error': 'Invalid request',
                'details': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    session_code = serializer.validated_data['session_code']
    
    # Log the received session code for debugging
    logger.info(f"Received session code from client: length={len(session_code)}, first_chars={session_code[:20]}...")
    
    # Clean the session code (remove any whitespace)
    session_code = session_code.strip()
    logger.info(f"Cleaned session code: length={len(session_code)}")
    
    try:
        # Initialize services
        api_client = InjastAPIClient()
        token_validator = InjastTokenValidator()
        user_sync_service = UserSyncService()
        
        # Step 1: Exchange session code for access token
        logger.info(f"Exchanging session code: {session_code[:8]}... (length: {len(session_code)})")
        
        # Validate session code format (should be UUID-like)
        if len(session_code) < 20:
            logger.warning(f"Session code seems too short: {len(session_code)} characters")
        
        access_token = api_client.exchange_session_code(session_code)
        
        # Step 2: Validate token
        logger.info("Validating Injast token")
        token_payload = token_validator.validate_token(access_token)
        
        # Step 3: Fetch user data from Injast (CRITICAL for name/email)
        # Retry logic to ensure we get name information
        logger.info("Fetching user data from Injast (name is important)")
        user_data = {}
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                user_data = api_client.get_user_basic(access_token)
                # If we got data with name fields, break
                if user_data.get('first_name') or user_data.get('last_name'):
                    logger.info("Successfully fetched user data with name information")
                    break
                else:
                    logger.warning("User data fetched but missing name fields")
                    break
            except Exception as e:
                retry_count += 1
                if retry_count < max_retries:
                    logger.warning(f"Failed to fetch user data (attempt {retry_count}/{max_retries}): {e}")
                    import time
                    time.sleep(1)  # Wait 1 second before retry
                else:
                    logger.error(f"Failed to fetch user data after {max_retries} attempts: {e}")
                    logger.warning("⚠️  WARNING: User name/email will not be available without API data")
                    # Create minimal user_data from token payload
                    user_data = {
                        'national_id': token_payload.get('uid') or token_payload.get('nid'),
                        'mobile_number': token_payload.get('mbn'),
                        'mobile_country_code': token_payload.get('mbc'),
                    }
        
        # Step 4: Create or update local user
        logger.info("Syncing user to local database")
        user = user_sync_service.create_or_update_user(
            injast_data=user_data,
            access_token=access_token,
            token_payload=token_payload
        )
        
        # Step 5: Generate local JWT tokens
        refresh = RefreshToken.for_user(user)
        
        logger.info(f"SSO login successful for user: {user.username}")
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        logger.error(f"SSO callback error: {e}")
        return Response(
            {
                'error': 'SSO authentication failed',
                'message': str(e)
            },
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        logger.exception(f"Unexpected error in SSO callback: {e}")
        return Response(
            {
                'error': 'Internal server error',
                'message': 'An unexpected error occurred during SSO authentication'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def injast_user_info_view(request):
    """
    Get current user's Injast-linked information.
    Only available if user authenticated via Injast SSO.
    """
    try:
        injast_user = request.user.injast_user
        serializer = InjastUserSerializer(injast_user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except InjastUser.DoesNotExist:
        return Response(
            {
                'error': 'User not linked to Injast',
                'message': 'This user account is not associated with Injast SSO'
            },
            status=status.HTTP_404_NOT_FOUND
        )
