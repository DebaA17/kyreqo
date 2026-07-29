from django.contrib import admin
from .models import Collection, CollectionRequest

@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'workspace', 'created_at', 'updated_at')
    list_filter = ('workspace', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)

@admin.register(CollectionRequest)
class CollectionRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'collection', 'method', 'url', 'created_at', 'updated_at')
    list_filter = ('method', 'collection', 'created_at')
    search_fields = ('name', 'description', 'url')
    ordering = ('created_at',)
