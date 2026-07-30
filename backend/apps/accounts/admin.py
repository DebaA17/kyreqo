from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    
    list_display = ('id', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    
    
    search_fields = ('email', 'first_name', 'last_name')
    
    
    ordering = ('email',)
    
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'avatar')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'is_staff', 'is_active'),
        }),
    )


admin.site.register(CustomUser, CustomUserAdmin)


from .models import LoginAttempt


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'email', 'user', 'ip_address', 'is_successful', 'user_agent')
    list_filter = ('is_successful', 'timestamp')
    search_fields = ('email', 'ip_address', 'user_agent')
    ordering = ('-timestamp',)

    
    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]