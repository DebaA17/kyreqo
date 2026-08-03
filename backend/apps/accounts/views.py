from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer

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

        # Send verification email
        try:
            from .utils import send_verification_email
            send_verification_email(user)
        except Exception as e:
            print(f"Error sending verification email: {e}")

        user_data = UserSerializer(user).data
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
        email = request.data.get('email', '')
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
            user = User.objects.filter(email=email).first()
            if user:
                from django.contrib.auth.models import update_last_login
                update_last_login(None, user)

            LoginAttempt.objects.create(
                email=email,
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
                is_successful=True
            )
            return response
        except Exception as e:
            user = User.objects.filter(email=email).first()
            LoginAttempt.objects.create(
                email=email,
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


import uuid
import datetime
from django.utils import timezone
from .serializers import ForgotPasswordSerializer, ResetPasswordConfirmSerializer

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp = request.data.get('otp')
        if not email or not otp:
            return Response({"detail": "Email and verification code are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(email=email, verification_otp=otp).first()
        if not user:
            return Response({"detail": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)
        
        user.email_verified = True
        user.verification_otp = None
        user.save()
        return Response({"detail": "Email verified successfully."}, status=status.HTTP_200_OK)


class ResendVerificationView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        if not email and request.user.is_authenticated:
            email = request.user.email
        
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(email=email).first()
        if not user:
            # Standard security practice: return success status to prevent user enumeration
            return Response({"detail": "Verification email resent if the account exists."}, status=status.HTTP_200_OK)
            
        if user.email_verified:
            return Response({"detail": "Email is already verified."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Re-generate verification OTP and send
        import secrets
        user.verification_otp = f"{secrets.SystemRandom().randint(100000, 999999)}"
        user.save()
        
        try:
            from .utils import send_verification_email
            send_verification_email(user)
        except Exception as e:
            print(f"Error resending verification email: {e}")
            return Response({"detail": "Failed to send email. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response({"detail": "Verification email resent successfully."}, status=status.HTTP_200_OK)


class ForgotPasswordView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSerializer
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email=email).first()
        if user:
            user.password_reset_token = uuid.uuid4().hex
            user.password_reset_token_created_at = timezone.now()
            user.save()

            try:
                from .utils import send_password_reset_email
                send_password_reset_email(user)
            except Exception as e:
                print(f"Error sending password reset email: {e}")
                return Response({"detail": "Failed to send email. Please try again later."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Always return success status to prevent user enumeration
        return Response(
            {"detail": "If your email is registered with us, you will receive a password reset link shortly."},
            status=status.HTTP_200_OK
        )


class ResetPasswordConfirmView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = ResetPasswordConfirmSerializer
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']

        user = User.objects.filter(password_reset_token=token).first()
        if not user:
            return Response({"detail": "Invalid or expired reset token."}, status=status.HTTP_400_BAD_REQUEST)

        # Check token expiration (1 hour)
        expiry = user.password_reset_token_created_at + datetime.timedelta(hours=1)
        if timezone.now() > expiry:
            return Response({"detail": "Password reset token has expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Set new password and clear token
        user.set_password(password)
        user.password_reset_token = None
        user.password_reset_token_created_at = None
        user.save()

        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)


