from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    # Display these fields in the user list
    list_display = ('id', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    
    # Fields to search
    search_fields = ('email', 'first_name', 'last_name')
    
    # Order by email
    ordering = ('email',)
    
    # Fields shown when editing a user
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'avatar')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields shown when adding a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'is_staff', 'is_active'),
        }),
    )

# Register the CustomUser model with the admin
admin.site.register(CustomUser, CustomUserAdmin)