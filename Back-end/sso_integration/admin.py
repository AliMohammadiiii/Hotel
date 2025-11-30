from django.contrib import admin
from .models import InjastUser


@admin.register(InjastUser)
class InjastUserAdmin(admin.ModelAdmin):
    """Admin interface for InjastUser model."""
    list_display = ['national_id', 'user', 'mobile_number', 'last_synced_at', 'created_at']
    list_filter = ['created_at', 'last_synced_at']
    search_fields = ['national_id', 'user__username', 'user__email', 'mobile_number']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'national_id')
        }),
        ('Injast Data', {
            'fields': ('mobile_number', 'mobile_country_code', 'last_synced_at')
        }),
        ('Token Information', {
            'fields': ('token_expires_at',),
            'description': 'Access token is stored encrypted and not displayed here.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
