from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
import pyotp
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    TwoFactorVerifySerializer,
    TwoFactorDisableSerializer,
    TwoFactorLoginSerializer
)

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_scope = 'auth'

    def create(self, request, *args, **kwargs):
        turnstile_token = request.data.get('turnstile_token')
        ip_address = request.META.get('REMOTE_ADDR')
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()

        from django.conf import settings
        from .utils import validate_turnstile_token
        if not settings.DEBUG and not validate_turnstile_token(turnstile_token, ip_address):
            return Response(
                {"detail": "Security check failed. Please refresh the page and try again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Log successful login attempt for registration
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        LoginAttempt.objects.create(
            email=user.email,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            is_successful=True
        )

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        user_data = UserSerializer(user).data
        user_data['tokens'] = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
        return Response(user_data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import permissions
from .models import LoginAttempt
from .serializers import LoginAttemptSerializer, UserAdminDetailSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        email = str(request.data.get('email') or '').strip()
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()

        turnstile_token = request.data.get('turnstile_token')
        from django.conf import settings
        from .utils import validate_turnstile_token
        if not settings.DEBUG and not validate_turnstile_token(turnstile_token, ip_address):
            return Response(
                {"detail": "Security check failed. Please refresh the page and try again."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            response = super().post(request, *args, **kwargs)
            user = None
            if isinstance(response.data, dict) and 'access' in response.data:
                from rest_framework_simplejwt.tokens import AccessToken
                token_payload = AccessToken(response.data['access'])
                user_id = token_payload.get('user_id')
                user = User.objects.filter(id=user_id).first()
            if not user:
                user = User.objects.filter(email__iexact=email).first()

            if user and user.two_factor_enabled and user.two_factor_secret:
                code = request.data.get('code')
                if code:
                    attempts_key = f"2fa-fail:{user.id}"
                    from django.core.cache import cache
                    failed_attempts = cache.get(attempts_key, 0)
                    if failed_attempts >= 5:
                        return Response(
                            {"detail": "Too many failed attempts. Please try again later."},
                            status=status.HTTP_429_TOO_MANY_REQUESTS
                        )
                    totp = pyotp.TOTP(user.two_factor_secret)
                    if not totp.verify(code, valid_window=1):
                        cache.set(attempts_key, failed_attempts + 1, timeout=300)
                        LoginAttempt.objects.create(
                            email=user.email,
                            user=user,
                            ip_address=ip_address,
                            user_agent=user_agent,
                            is_successful=False
                        )
                        return Response(
                            {"detail": "Invalid two-factor authentication code."},
                            status=status.HTTP_401_UNAUTHORIZED
                        )
                    cache.delete(attempts_key)
                else:
                    from django.core import signing
                    temp_token = signing.dumps({"user_id": user.id}, salt="2fa-pre-auth")
                    return Response({
                        "requires_2fa": True,
                        "temp_token": temp_token,
                        "email": user.email
                    }, status=status.HTTP_200_OK)

            if user:
                from django.contrib.auth.models import update_last_login
                update_last_login(None, user)

            LoginAttempt.objects.create(
                email=user.email if user else email,
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
                is_successful=True
            )
            return response
        except Exception as e:
            user = User.objects.filter(email__iexact=email.strip()).first()
            LoginAttempt.objects.create(
                email=user.email if user else email,
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
                is_successful=False
            )
            raise e


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserAdminDetailSerializer
    permission_classes = [IsAdminUser]


class AdminLoginLogListView(generics.ListAPIView):
    queryset = LoginAttempt.objects.all().order_by('-timestamp')
    serializer_class = LoginAttemptSerializer
    permission_classes = [IsAdminUser]

from rest_framework.decorators import api_view, permission_classes
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding(request):
    """Mark the current user's onboarding as completed."""
    user = request.user
    user.has_completed_onboarding = True
    user.save(update_fields=['has_completed_onboarding'])
    return Response(
        {'message': 'Onboarding completed successfully'},
        status=status.HTTP_200_OK
    )


class TwoFactorSetupView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.two_factor_enabled:
            return Response(
                {'detail': 'Two-factor authentication is already enabled. Please disable it before setting up again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        user.save(update_fields=['two_factor_secret'])
        totp = pyotp.TOTP(secret)
        otpauth_url = totp.provisioning_uri(name=user.email, issuer_name='Kyreqo')
        return Response({
            'secret': secret,
            'otpauth_url': otpauth_url
        }, status=status.HTTP_200_OK)


class TwoFactorVerifyView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        user = request.user
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']

        if not user.two_factor_secret:
            return Response(
                {'detail': 'Two-factor setup has not been initiated.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(code, valid_window=1):
            return Response(
                {'detail': 'Invalid two-factor authentication code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.two_factor_enabled = True
        user.save(update_fields=['two_factor_enabled'])
        return Response({
            'detail': 'Two-factor authentication successfully enabled.',
            'two_factor_enabled': True
        }, status=status.HTTP_200_OK)


class TwoFactorDisableView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        user = request.user
        serializer = TwoFactorDisableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password = serializer.validated_data['password']
        code = serializer.validated_data['code']

        if not user.check_password(password):
            return Response(
                {'detail': 'Invalid password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.two_factor_enabled or not user.two_factor_secret:
            return Response(
                {'detail': 'Two-factor authentication is not enabled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(code, valid_window=1):
            return Response(
                {'detail': 'Invalid two-factor authentication code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.two_factor_enabled = False
        user.two_factor_secret = str()
        user.save(update_fields=['two_factor_enabled', 'two_factor_secret'])
        return Response({
            'detail': 'Two-factor authentication disabled successfully.',
            'two_factor_enabled': False
        }, status=status.HTTP_200_OK)


class TwoFactorLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        serializer = TwoFactorLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        temp_token = serializer.validated_data['temp_token']
        code = serializer.validated_data['code']

        from django.core import signing
        try:
            payload = signing.loads(temp_token, salt="2fa-pre-auth", max_age=300)
            user_id = payload.get('user_id')
            user = User.objects.get(id=user_id)
        except (signing.BadSignature, signing.SignatureExpired, User.DoesNotExist):
            return Response(
                {'detail': 'Verification session has expired or is invalid. Please log in again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.two_factor_enabled or not user.two_factor_secret:
            return Response(
                {'detail': 'Two-factor authentication is not configured for this user.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ip_address = request.META.get('REMOTE_ADDR')
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        attempts_key = f"2fa-fail:{user.id}"
        from django.core.cache import cache
        failed_attempts = cache.get(attempts_key, 0)
        if failed_attempts >= 5:
            return Response(
                {'detail': 'Too many failed attempts. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(code, valid_window=1):
            cache.set(attempts_key, failed_attempts + 1, timeout=300)
            LoginAttempt.objects.create(
                email=user.email,
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
                is_successful=False
            )
            return Response(
                {'detail': 'Invalid two-factor authentication code.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        cache.delete(attempts_key)

        from django.contrib.auth.models import update_last_login
        update_last_login(None, user)

        LoginAttempt.objects.create(
            email=user.email,
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
            is_successful=True
        )

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
