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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
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
    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '')
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()

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

