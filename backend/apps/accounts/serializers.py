from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'avatar', 'is_staff', 'is_superuser', 'date_joined','has_completed_onboarding')
        read_only_fields = ('id', 'email', 'date_joined', 'is_staff', 'is_superuser')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'first_name', 'last_name', 'avatar')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields must match."})  # nosec B105
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            avatar=validated_data.get('avatar', None)
        )
        return user


from .models import CustomUser, LoginAttempt


class LoginAttemptSerializer(serializers.ModelSerializer):
    browser = serializers.SerializerMethodField()
    os = serializers.SerializerMethodField()

    class Meta:
        model = LoginAttempt
        fields = ('id', 'email', 'user', 'ip_address', 'user_agent', 'browser', 'os', 'is_successful', 'timestamp')

    def get_browser(self, obj):
        ua = obj.user_agent or ''
        if "Chrome" in ua and "Safari" in ua:
            return "Chrome"
        elif "Safari" in ua:
            return "Safari"
        elif "Firefox" in ua:
            return "Firefox"
        elif "Edge" in ua:
            return "Edge"
        return "Other/API Client"

    def get_os(self, obj):
        ua = obj.user_agent or ''
        if "Windows" in ua:
            return "Windows"
        elif "Macintosh" in ua:
            return "macOS"
        elif "Linux" in ua:
            return "Linux"
        elif "Android" in ua:
            return "Android"
        elif "iPhone" in ua or "iPad" in ua:
            return "iOS"
        return "Other/Unknown"


class UserAdminDetailSerializer(serializers.ModelSerializer):
    last_login_ip = serializers.SerializerMethodField()
    last_login_browser = serializers.SerializerMethodField()
    last_login_os = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'avatar', 'is_active',
            'is_staff', 'is_superuser', 'last_login', 'date_joined',
            'last_login_ip', 'last_login_browser', 'last_login_os'
        )
        read_only_fields = fields

    def get_latest_success_log(self, obj):
        if not hasattr(self, '_latest_logs'):
            self._latest_logs = {}
        if obj.id not in self._latest_logs:
            log = LoginAttempt.objects.filter(user=obj, is_successful=True).order_by('-timestamp').first()
            self._latest_logs[obj.id] = log
        return self._latest_logs[obj.id]

    def get_last_login_ip(self, obj):
        log = self.get_latest_success_log(obj)
        return log.ip_address if log else None

    def get_last_login_browser(self, obj):
        log = self.get_latest_success_log(obj)
        if not log:
            return None
        ua = log.user_agent or ''
        if "Chrome" in ua and "Safari" in ua:
            return "Chrome"
        elif "Safari" in ua:
            return "Safari"
        elif "Firefox" in ua:
            return "Firefox"
        elif "Edge" in ua:
            return "Edge"
        return "Other/API"

    def get_last_login_os(self, obj):
        log = self.get_latest_success_log(obj)
        if not log:
            return None
        ua = log.user_agent or ''
        if "Windows" in ua:
            return "Windows"
        elif "Macintosh" in ua:
            return "macOS"
        elif "Linux" in ua:
            return "Linux"
        elif "Android" in ua:
            return "Android"
        elif "iPhone" in ua or "iPad" in ua:
            return "iOS"
        return "Other"

