from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from datetime import date, timedelta
from .models import Accommodation, AccommodationImage, Amenity, RoomAvailability


class AccommodationImageInline(admin.StackedInline):
    """Inline admin for accommodation images"""
    model = AccommodationImage
    extra = 3
    fields = ('image', 'image_preview',)
    readonly_fields = ('image_preview',)
    verbose_name = "تصویر اضافی"
    verbose_name_plural = "تصاویر اضافی"
    
    def image_preview(self, obj):
        if obj and obj.pk and obj.image:
            return format_html(
                '<img src="{}" width="300" height="200" style="object-fit: cover; border-radius: 8px; margin-top: 10px;" />',
                obj.image.url
            )
        return format_html('<p style="color: #999; margin-top: 10px;">پس از آپلود تصویر، پیش‌نمایش نمایش داده می‌شود</p>')
    image_preview.short_description = "پیش‌نمایش تصویر"


class RoomAvailabilityInline(admin.TabularInline):
    """Inline admin for room availability"""
    model = RoomAvailability
    extra = 0
    fields = ('date', 'price', 'status',)
    readonly_fields = ('created_at', 'updated_at',)
    ordering = ['date']


@admin.register(Accommodation)
class AccommodationAdmin(admin.ModelAdmin):
    """Admin configuration for Accommodation model"""
    list_display = ('title', 'city', 'province', 'capacity', 'price_per_night', 'rating', 'main_image_preview', 'created_at')
    list_filter = ('city', 'province', 'capacity', 'rating', 'created_at')
    search_fields = ('title', 'city', 'province', 'address', 'description')
    filter_horizontal = ('amenities',)
    inlines = [AccommodationImageInline, RoomAvailabilityInline]
    readonly_fields = ('main_image_preview', 'created_at', 'updated_at')
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('title', 'main_image', 'main_image_preview', 'description')
        }),
        ('موقعیت', {
            'fields': ('province', 'city', 'address')
        }),
        ('مشخصات', {
            'fields': ('capacity', 'beds_description', 'area', 'price_per_night', 'rating')
        }),
        ('امکانات', {
            'fields': ('amenities',)
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def main_image_preview(self, obj):
        if obj.main_image:
            return format_html(
                '<img src="{}" width="200" height="150" style="object-fit: cover;" />',
                obj.main_image.url
            )
        return "No image"
    main_image_preview.short_description = "پیش‌نمایش تصویر اصلی"


@admin.register(AccommodationImage)
class AccommodationImageAdmin(admin.ModelAdmin):
    """Admin configuration for AccommodationImage model"""
    list_display = ('accommodation', 'image_preview', 'created_at')
    list_filter = ('accommodation', 'created_at')
    search_fields = ('accommodation__title', 'accommodation__city', 'accommodation__province')
    readonly_fields = ('image_preview', 'created_at')
    ordering = ['-created_at']
    
    fieldsets = (
        ('اطلاعات', {
            'fields': ('accommodation', 'image', 'image_preview')
        }),
        ('تاریخ', {
            'fields': ('created_at',)
        }),
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="300" height="200" style="object-fit: cover; border-radius: 8px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = "پیش‌نمایش تصویر"


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    """Admin configuration for Amenity model"""
    list_display = ('name', 'category', 'icon_preview', 'icon')
    list_filter = ('category',)
    search_fields = ('name', 'category')
    readonly_fields = ('icon_preview',)
    
    fieldsets = (
        ('اطلاعات', {
            'fields': ('name', 'category', 'icon', 'icon_preview')
        }),
    )
    
    def icon_preview(self, obj):
        """Show SVG icon preview"""
        if obj.icon:
            # Check if it's an SVG file
            if obj.icon.name.endswith('.svg'):
                return format_html(
                    '<img src="{}" width="32" height="32" style="object-fit: contain;" />',
                    obj.icon.url
                )
            else:
                return format_html(
                    '<img src="{}" width="32" height="32" style="object-fit: contain;" />',
                    obj.icon.url
                )
        return "No icon"
    icon_preview.short_description = "پیش‌نمایش آیکون"


@admin.register(RoomAvailability)
class RoomAvailabilityAdmin(admin.ModelAdmin):
    """Admin configuration for RoomAvailability model"""
    list_display = ('accommodation', 'date', 'price', 'status', 'get_effective_price', 'created_at')
    list_filter = ('status', 'date', 'accommodation', 'created_at')
    search_fields = ('accommodation__title', 'accommodation__city',)
    date_hierarchy = 'date'
    ordering = ['-date', 'accommodation']
    readonly_fields = ('created_at', 'updated_at', 'get_effective_price')
    
    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('accommodation', 'date', 'status', 'price')
        }),
        ('اطلاعات قیمت', {
            'fields': ('get_effective_price',),
            'classes': ('collapse',)
        }),
        ('تاریخ‌ها', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_effective_price(self, obj):
        """Show effective price (custom or default)"""
        if obj.price is not None:
            return f"{obj.price:,.0f} تومان (قیمت اختصاصی)"
        return f"{obj.accommodation.price_per_night:,.0f} تومان (قیمت پیش‌فرض)"
    get_effective_price.short_description = "قیمت موثر"
    
    actions = ['create_monthly_availability', 'create_weekly_availability']
    
    def create_monthly_availability(self, request, queryset):
        """Bulk create availability for next 30 days"""
        from datetime import date, timedelta
        
        accommodations = set(queryset.values_list('accommodation', flat=True))
        if not accommodations:
            self.message_user(request, "لطفا حداقل یک رکورد را انتخاب کنید.", level='error')
            return
        
        today = date.today()
        created_count = 0
        
        for accommodation_id in accommodations:
            accommodation = Accommodation.objects.get(id=accommodation_id)
            for i in range(30):
                check_date = today + timedelta(days=i)
                RoomAvailability.objects.get_or_create(
                    accommodation=accommodation,
                    date=check_date,
                    defaults={'status': 'available'}
                )
                created_count += 1
        
        self.message_user(request, f"{created_count} رکورد وضعیت روزانه ایجاد شد.")
    create_monthly_availability.short_description = "ایجاد وضعیت برای 30 روز آینده"
    
    def create_weekly_availability(self, request, queryset):
        """Bulk create availability for next 7 days"""
        from datetime import date, timedelta
        
        accommodations = set(queryset.values_list('accommodation', flat=True))
        if not accommodations:
            self.message_user(request, "لطفا حداقل یک رکورد را انتخاب کنید.", level='error')
            return
        
        today = date.today()
        created_count = 0
        
        for accommodation_id in accommodations:
            accommodation = Accommodation.objects.get(id=accommodation_id)
            for i in range(7):
                check_date = today + timedelta(days=i)
                RoomAvailability.objects.get_or_create(
                    accommodation=accommodation,
                    date=check_date,
                    defaults={'status': 'available'}
                )
                created_count += 1
        
        self.message_user(request, f"{created_count} رکورد وضعیت روزانه ایجاد شد.")
    create_weekly_availability.short_description = "ایجاد وضعیت برای 7 روز آینده"
