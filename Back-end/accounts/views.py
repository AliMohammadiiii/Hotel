from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserSerializer, SignupSerializer
from .admin_tokens import create_admin_access_token


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint that returns JWT tokens"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'نام کاربری و رمز عبور الزامی است'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'نام کاربری یا رمز عبور اشتباه است'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {'error': 'حساب کاربری غیرفعال است'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login_view(request):
    """
    Login endpoint for Admin panel that returns a separate Admin JWT.

    This token is completely separate from the normal application JWT and
    is intended only for admin APIs.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'نام کاربری و رمز عبور الزامی است'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)

    if user is None:
        return Response(
            {'error': 'نام کاربری یا رمز عبور اشتباه است'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active or not user.is_staff:
        return Response(
            {'error': 'دسترسی ادمین مجاز نیست'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Issue both normal app tokens and separate admin token
    refresh = RefreshToken.for_user(user)
    admin_token = create_admin_access_token(user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'admin_access': admin_token,
        'user': UserSerializer(user).data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """Signup endpoint that creates a new user and returns JWT tokens"""
    serializer = SignupSerializer(data=request.data)
    
    if not serializer.is_valid():
        errors = {}
        for field, messages in serializer.errors.items():
            if isinstance(messages, list) and len(messages) > 0:
                errors[field] = messages[0]
            else:
                errors[field] = messages
        return Response(
            {'error': 'اطلاعات وارد شده معتبر نیست', 'errors': errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info_view(request):
    """Get current user information"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
