from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db.models import Min, Max, Q
from django.shortcuts import get_object_or_404
from datetime import datetime, date, timedelta
from .models import Accommodation, Amenity, RoomAvailability
from .serializers import AccommodationListSerializer, AccommodationDetailSerializer, RoomAvailabilitySerializer
from .filters import AccommodationFilter
from reservations.models import Reservation
import requests


class AccommodationListView(generics.ListAPIView):
    """List all accommodations with filtering support"""
    permission_classes = [AllowAny]
    queryset = Accommodation.objects.all()
    serializer_class = AccommodationListSerializer
    filterset_class = AccommodationFilter
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AccommodationDetailView(generics.RetrieveAPIView):
    """Retrieve a single accommodation with full details"""
    permission_classes = [AllowAny]
    queryset = Accommodation.objects.all()
    serializer_class = AccommodationDetailSerializer
    lookup_field = 'id'
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


@api_view(['GET'])
@permission_classes([AllowAny])
def filter_options_view(request):
    """Return available filter options for frontend"""
    accommodations = Accommodation.objects.all()
    
    # Get unique cities
    cities = list(accommodations.values_list('city', flat=True).distinct())
    
    # Get price range
    price_range = accommodations.aggregate(
        min_price=Min('price_per_night'),
        max_price=Max('price_per_night')
    )
    
    # Get all amenities
    amenities = Amenity.objects.all().values('id', 'name', 'category')
    amenities_list = [
        {
            'id': amenity['id'],
            'name': amenity['name'],
            'category': amenity['category']
        }
        for amenity in amenities
    ]
    
    # Get unique provinces
    provinces = list(accommodations.values_list('province', flat=True).distinct())
    
    return Response({
        'cities': cities,
        'provinces': provinces,
        'price_range': {
            'min': float(price_range['min_price']) if price_range['min_price'] else 0,
            'max': float(price_range['max_price']) if price_range['max_price'] else 0,
        },
        'amenities': amenities_list,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def unavailable_dates_view(request, id):
    """Return unavailable dates for an accommodation (reserved, pending, or marked unavailable)"""
    accommodation = get_object_or_404(Accommodation, id=id)
    
    # Get all reservations for this accommodation that are pending or confirmed
    reservations = Reservation.objects.filter(
        accommodation=accommodation,
        status__in=['pending', 'confirmed']
    ).exclude(
        status='cancelled'
    )
    
    # Get RoomAvailability entries that are unavailable
    unavailable_availability = RoomAvailability.objects.filter(
        accommodation=accommodation,
        status__in=['unavailable', 'full', 'under_maintenance', 'blocked', 'reserved']
    )
    
    # Collect all unavailable dates
    unavailable_dates = []
    today = date.today()
    
    # Add dates from reservations
    for reservation in reservations:
        check_in = reservation.check_in_date
        check_out = reservation.check_out_date
        
        # Add all dates from check_in (inclusive) to check_out (exclusive)
        current_date = check_in
        while current_date < check_out:
            if current_date >= today:  # Only include future dates
                unavailable_dates.append(current_date.isoformat())
            current_date = current_date + timedelta(days=1)
    
    # Add dates from RoomAvailability with unavailable status
    for availability in unavailable_availability:
        if availability.date >= today:
            unavailable_dates.append(availability.date.isoformat())
    
    # Remove duplicates and sort
    unavailable_dates = sorted(list(set(unavailable_dates)))
    
    return Response({
        'accommodation_id': accommodation.id,
        'unavailable_dates': unavailable_dates
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def availability_calendar_view(request, id):
    """Return availability calendar with prices for a date range"""
    accommodation = get_object_or_404(Accommodation, id=id)
    
    # Get date range from query parameters
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    
    if not start_date_str or not end_date_str:
        return Response({
            'error': 'Missing required parameters: start_date, end_date (format: YYYY-MM-DD)'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        start_date = date.fromisoformat(start_date_str)
        end_date = date.fromisoformat(end_date_str)
    except (ValueError, TypeError):
        return Response({
            'error': 'Invalid date format. Use YYYY-MM-DD format.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if end_date <= start_date:
        return Response({
            'error': 'end_date must be after start_date'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get availability entries for the date range
    availability_entries = RoomAvailability.objects.filter(
        accommodation=accommodation,
        date__gte=start_date,
        date__lt=end_date
    ).order_by('date')
    
    # Get reservations for the date range
    reservations = Reservation.objects.filter(
        accommodation=accommodation,
        status__in=['pending', 'confirmed'],
        check_in_date__lt=end_date,
        check_out_date__gt=start_date
    ).exclude(status='cancelled')
    
    # Build calendar data
    default_price = accommodation.price_per_night
    calendar_data = []
    current_date = start_date
    
    while current_date < end_date:
        # Find specific availability entry for this date
        entry = availability_entries.filter(date=current_date).first()
        
        # Check if date is reserved
        is_reserved = False
        for reservation in reservations:
            if reservation.check_in_date <= current_date < reservation.check_out_date:
                is_reserved = True
                break
        
        # Always use default price as base
        day_price = default_price
        has_custom_price = False
        
        if entry:
            # If entry has a custom price set, use it
            if entry.price is not None:
                day_price = entry.price
                has_custom_price = True
            
            day_data = {
                'date': current_date.isoformat(),
                'price': str(day_price),
                'default_price': str(default_price),
                'has_custom_price': has_custom_price,
                'status': entry.status,
                'is_available': entry.is_available() and not is_reserved,
                'is_reserved': is_reserved,
            }
        else:
            # No specific entry, use default price and assume available (unless reserved)
            day_data = {
                'date': current_date.isoformat(),
                'price': str(default_price),
                'default_price': str(default_price),
                'has_custom_price': False,
                'status': 'reserved' if is_reserved else 'available',
                'is_available': not is_reserved,
                'is_reserved': is_reserved,
            }
        
        calendar_data.append(day_data)
        current_date += timedelta(days=1)
    
    return Response({
        'accommodation_id': accommodation.id,
        'accommodation_title': accommodation.title,
        'default_price': str(default_price),
        'start_date': start_date_str,
        'end_date': end_date_str,
        'calendar': calendar_data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def check_holiday_view(request):
    """Check if a Persian date is a holiday using holidayapi.ir"""
    year = request.GET.get('year')
    month = request.GET.get('month')
    day = request.GET.get('day')
    
    if not all([year, month, day]):
        return Response({
            'error': 'Missing required parameters: year, month, day'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        year = int(year)
        month = int(month)
        day = int(day)
    except ValueError:
        return Response({
            'error': 'Invalid date parameters. Must be integers.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Format month and day with leading zeros if needed
    month_str = str(month).zfill(2)
    day_str = str(day).zfill(2)
    
    # Construct API URL: https://holidayapi.ir/jalali/{year}/{month}/{day}
    api_url = f'https://holidayapi.ir/jalali/{year}/{month_str}/{day_str}'
    
    try:
        response = requests.get(api_url, timeout=5)
        
        # If 404, the date is not a holiday
        if response.status_code == 404:
            return Response({
                'is_holiday': False,
                'holiday_name': '',
                'year': year,
                'month': month,
                'day': day
            })
        
        # For other status codes, raise exception
        response.raise_for_status()
        data = response.json()
        
        # Check if the date is a holiday
        # The API returns data if it's a holiday - if we got here, it's likely a holiday
        # Try to extract holiday info if available
        is_holiday = True  # If API returned data, it's a holiday
        holiday_name = ''
        
        if isinstance(data, dict):
            holiday_name = data.get('description', '') or data.get('title', '') or data.get('name', '')
            # Some APIs might have is_holiday flag
            if 'is_holiday' in data:
                is_holiday = bool(data.get('is_holiday', True))
            elif 'events' in data and isinstance(data['events'], list) and len(data['events']) > 0:
                event = data['events'][0]
                holiday_name = event.get('description', '') or event.get('title', '')
        elif isinstance(data, list) and len(data) > 0:
            holiday_name = data[0].get('description', '') or data[0].get('title', '')
        
        return Response({
            'is_holiday': is_holiday,
            'holiday_name': holiday_name,
            'year': year,
            'month': month,
            'day': day
        })
    except requests.exceptions.HTTPError as e:
        # For HTTP errors other than 404, return False
        return Response({
            'is_holiday': False,
            'holiday_name': '',
            'year': year,
            'month': month,
            'day': day,
            'error': str(e) if request.GET.get('debug') else None
        })
    except requests.exceptions.RequestException as e:
        # If API fails (network error, timeout, etc.), return False (not a holiday)
        # This ensures the calendar still works even if API is down
        return Response({
            'is_holiday': False,
            'holiday_name': '',
            'year': year,
            'month': month,
            'day': day,
            'error': str(e) if request.GET.get('debug') else None
        })
    except Exception as e:
        return Response({
            'error': f'Unexpected error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
