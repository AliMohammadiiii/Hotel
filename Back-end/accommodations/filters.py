import django_filters
from .models import Accommodation


class AccommodationFilter(django_filters.FilterSet):
    """Filter for Accommodation model"""
    city = django_filters.CharFilter(field_name='city', lookup_expr='icontains')
    price_min = django_filters.NumberFilter(field_name='price_per_night', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price_per_night', lookup_expr='lte')
    capacity = django_filters.NumberFilter(field_name='capacity', lookup_expr='exact')
    province = django_filters.CharFilter(field_name='province', lookup_expr='icontains')
    
    ordering = django_filters.OrderingFilter(
        fields=(
            ('price_per_night', 'price'),
            ('rating', 'rating'),
            ('created_at', 'created_at'),
        ),
    )
    
    class Meta:
        model = Accommodation
        fields = ['city', 'province', 'capacity']





