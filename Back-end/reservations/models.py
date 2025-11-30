from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.utils import timezone
from datetime import timedelta
from accommodations.models import Accommodation, RoomAvailability
from decimal import Decimal


class Reservation(models.Model):
    """Reservation model for hotel accommodations"""
    
    STATUS_CHOICES = [
        ('pending', 'در انتظار'),
        ('confirmed', 'تایید شده'),
        ('cancelled', 'لغو شده'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservations', verbose_name="کاربر")
    accommodation = models.ForeignKey(Accommodation, on_delete=models.CASCADE, related_name='reservations', verbose_name="اقامتگاه")
    check_in_date = models.DateField(verbose_name="تاریخ ورود")
    check_out_date = models.DateField(verbose_name="تاریخ خروج")
    number_of_guests = models.IntegerField(validators=[MinValueValidator(1)], verbose_name="تعداد مهمان")
    total_price = models.DecimalField(max_digits=12, decimal_places=0, blank=True, null=True, verbose_name="قیمت کل (تومان)")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="وضعیت")
    contact_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="شماره تماس")
    contact_email = models.EmailField(blank=True, null=True, verbose_name="ایمیل")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
    class Meta:
        verbose_name = "رزرو"
        verbose_name_plural = "رزروها"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.accommodation.title} - {self.check_in_date}"
    
    def get_nights(self):
        """Calculate number of nights"""
        return (self.check_out_date - self.check_in_date).days
    
    def calculate_total_price(self):
        """Calculate total price based on day-by-day pricing"""
        if not self.accommodation or not self.check_in_date or not self.check_out_date:
            return Decimal('0')
        
        total_price = Decimal('0')
        current_date = self.check_in_date
        
        while current_date < self.check_out_date:
            # Check if there's a RoomAvailability entry for this date
            availability = RoomAvailability.objects.filter(
                accommodation=self.accommodation,
                date=current_date
            ).first()
            
            if availability:
                # Use day-specific price
                day_price = availability.get_price()
            else:
                # Use default accommodation price
                day_price = self.accommodation.price_per_night
            
            total_price += day_price
            current_date += timedelta(days=1)
        
        return total_price
    
    def get_price_breakdown(self):
        """Get detailed price breakdown per day"""
        if not self.accommodation or not self.check_in_date or not self.check_out_date:
            return []
        
        breakdown = []
        current_date = self.check_in_date
        
        while current_date < self.check_out_date:
            availability = RoomAvailability.objects.filter(
                accommodation=self.accommodation,
                date=current_date
            ).first()
            
            if availability:
                day_price = availability.get_price()
                status = availability.status
                is_custom_price = availability.price is not None
            else:
                day_price = self.accommodation.price_per_night
                status = 'available'
                is_custom_price = False
            
            breakdown.append({
                'date': current_date.isoformat(),
                'price': str(day_price),
                'status': status,
                'is_custom_price': is_custom_price,
            })
            
            current_date += timedelta(days=1)
        
        return breakdown
    
    def clean(self):
        """Validate reservation data"""
        from django.core.exceptions import ValidationError
        
        if self.check_in_date and self.check_out_date:
            if self.check_out_date <= self.check_in_date:
                raise ValidationError('تاریخ خروج باید بعد از تاریخ ورود باشد')
            
            if self.check_in_date < timezone.now().date():
                raise ValidationError('تاریخ ورود نمی‌تواند در گذشته باشد')
        
        if self.accommodation and self.number_of_guests:
            if self.number_of_guests > self.accommodation.capacity:
                raise ValidationError(f'تعداد مهمان نمی‌تواند بیشتر از ظرفیت اقامتگاه ({self.accommodation.capacity} نفر) باشد')
        
        # Check day-by-day availability
        if self.accommodation and self.check_in_date and self.check_out_date:
            current_date = self.check_in_date
            unavailable_dates = []
            
            while current_date < self.check_out_date:
                # Check RoomAvailability status
                availability = RoomAvailability.objects.filter(
                    accommodation=self.accommodation,
                    date=current_date
                ).first()
                
                if availability:
                    # Check if status allows booking
                    if availability.status not in ['available', 'reserved']:
                        unavailable_dates.append({
                            'date': current_date.isoformat(),
                            'status': availability.get_status_display(),
                            'reason': f"وضعیت: {availability.get_status_display()}"
                        })
                else:
                    # No specific entry, check if there are conflicting reservations
                    conflicting_reservations = Reservation.objects.filter(
                        accommodation=self.accommodation,
                        status__in=['pending', 'confirmed'],
                        check_in_date__lt=current_date + timedelta(days=1),
                        check_out_date__gt=current_date
                    ).exclude(id=self.id if self.id else None)
                    
                    if conflicting_reservations.exists():
                        unavailable_dates.append({
                            'date': current_date.isoformat(),
                            'status': 'reserved',
                            'reason': 'رزرو شده'
                        })
                
                current_date += timedelta(days=1)
            
            if unavailable_dates:
                dates_str = ', '.join([d['date'] for d in unavailable_dates])
                raise ValidationError(f'تاریخ‌های زیر در دسترس نیستند: {dates_str}')
    
    def save(self, *args, **kwargs):
        """Override save to calculate total price and validate"""
        self.full_clean()
        if self.total_price is None or self.total_price == 0:
            self.total_price = self.calculate_total_price()
        super().save(*args, **kwargs)
