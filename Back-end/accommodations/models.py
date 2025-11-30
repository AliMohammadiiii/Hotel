from django.db import models


class Amenity(models.Model):
    """Facilities available in accommodations (e.g., "سرویس بهداشتی فرنگی")"""
    name = models.CharField(max_length=200, verbose_name="نام")
    icon = models.FileField(upload_to='amenities/icons/', blank=True, null=True, verbose_name="آیکون SVG")
    category = models.CharField(max_length=100, blank=True, null=True, verbose_name="دسته‌بندی")
    
    class Meta:
        verbose_name = "امکانات"
        verbose_name_plural = "امکانات"
        ordering = ['category', 'name']
    
    def __str__(self):
        return self.name


class Accommodation(models.Model):
    """Represents a hotel room or suite (e.g., "سوییت هانی مون")"""
    title = models.CharField(max_length=200, verbose_name="عنوان")
    city = models.CharField(max_length=100, verbose_name="شهر")
    province = models.CharField(max_length=100, verbose_name="استان")
    address = models.TextField(verbose_name="آدرس")
    description = models.TextField(verbose_name="توضیحات")
    capacity = models.IntegerField(verbose_name="ظرفیت")
    beds_description = models.CharField(max_length=200, verbose_name="توضیحات تخت‌ها")
    area = models.IntegerField(verbose_name="متراژ (متر)")
    price_per_night = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="قیمت هر شب (تومان)")
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0, verbose_name="امتیاز")
    main_image = models.ImageField(upload_to='accommodations/', verbose_name="تصویر اصلی")
    amenities = models.ManyToManyField(Amenity, related_name='accommodations', blank=True, verbose_name="امکانات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
    class Meta:
        verbose_name = "اقامتگاه"
        verbose_name_plural = "اقامتگاه‌ها"
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class AccommodationImage(models.Model):
    """Additional images for accommodation carousel"""
    accommodation = models.ForeignKey(Accommodation, on_delete=models.CASCADE, related_name='images', verbose_name="اقامتگاه")
    image = models.ImageField(upload_to='accommodations/images/', verbose_name="تصویر")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    
    class Meta:
        verbose_name = "تصویر اقامتگاه"
        verbose_name_plural = "تصاویر اقامتگاه"
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.accommodation.title} - Image {self.id}"


class RoomAvailability(models.Model):
    """Daily availability and pricing for each accommodation"""
    
    STATUS_CHOICES = [
        ('available', 'موجود'),
        ('unavailable', 'غیرموجود'),
        ('full', 'پر'),
        ('under_maintenance', 'در حال تعمیر'),
        ('blocked', 'مسدود'),
        ('reserved', 'رزرو شده'),
    ]
    
    accommodation = models.ForeignKey(Accommodation, on_delete=models.CASCADE, related_name='availability', verbose_name="اقامتگاه")
    date = models.DateField(verbose_name="تاریخ")
    price = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True, verbose_name="قیمت (تومان)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available', verbose_name="وضعیت")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
    class Meta:
        verbose_name = "وضعیت روزانه اقامتگاه"
        verbose_name_plural = "وضعیت‌های روزانه اقامتگاه"
        ordering = ['date']
        unique_together = [['accommodation', 'date']]
        indexes = [
            models.Index(fields=['accommodation', 'date']),
            models.Index(fields=['date', 'status']),
        ]
    
    def __str__(self):
        return f"{self.accommodation.title} - {self.date} - {self.get_status_display()}"
    
    def is_available(self):
        """Check if the room is available for booking"""
        return self.status == 'available'
    
    def get_price(self):
        """Get price for this day, fallback to accommodation default price if not set"""
        if self.price is not None:
            return self.price
        return self.accommodation.price_per_night
