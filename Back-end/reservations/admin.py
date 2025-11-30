from django.contrib import admin
from .models import Reservation


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'accommodation', 'check_in_date', 'check_out_date', 'status', 'total_price', 'created_at']
    list_filter = ['status', 'check_in_date', 'check_out_date', 'created_at']
    search_fields = ['user__username', 'accommodation__title', 'contact_email', 'contact_phone']
    readonly_fields = ['created_at', 'updated_at', 'total_price']
    date_hierarchy = 'check_in_date'
    
    fieldsets = (
        ('اطلاعات کاربر', {
            'fields': ('user',)
        }),
        ('اطلاعات اقامتگاه', {
            'fields': ('accommodation',)
        }),
        ('جزئیات رزرو', {
            'fields': ('check_in_date', 'check_out_date', 'number_of_guests', 'total_price')
        }),
        ('اطلاعات تماس', {
            'fields': ('contact_phone', 'contact_email')
        }),
        ('وضعیت', {
            'fields': ('status',)
        }),
        ('زمان‌بندی', {
            'fields': ('created_at', 'updated_at')
        }),
    )
