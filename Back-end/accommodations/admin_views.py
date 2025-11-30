from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.conf import settings
from datetime import date, timedelta
from .models import Accommodation, AccommodationImage, Amenity, RoomAvailability
from .serializers import (
    AdminAccommodationSerializer,
    AdminAmenitySerializer,
    AdminRoomAvailabilitySerializer,
    AdminAccommodationImageSerializer
)


class AdminAccommodationViewSet(viewsets.ModelViewSet):
    """Admin viewset for Accommodation CRUD operations"""
    queryset = Accommodation.objects.all()
    serializer_class = AdminAccommodationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Filter accommodations by search query if provided"""
        queryset = Accommodation.objects.all().prefetch_related('amenities', 'images')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(city__icontains=search) |
                Q(province__icontains=search) |
                Q(description__icontains=search)
            )
        return queryset.order_by('-created_at')
    
    
    @action(detail=True, methods=['post'], url_path='images')
    def add_image(self, request, pk=None):
        """Add an image to accommodation"""
        accommodation = self.get_object()
        image = request.FILES.get('image')
        if not image:
            return Response(
                {'error': 'Image file is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        accommodation_image = AccommodationImage.objects.create(
            accommodation=accommodation,
            image=image
        )
        serializer = AdminAccommodationImageSerializer(
            accommodation_image,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], url_path='images/(?P<image_id>[0-9]+)')
    def delete_image(self, request, pk=None, image_id=None):
        """Delete an image from accommodation"""
        accommodation = self.get_object()
        image = get_object_or_404(
            AccommodationImage,
            id=image_id,
            accommodation=accommodation
        )
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAmenityViewSet(viewsets.ModelViewSet):
    """Admin viewset for Amenity CRUD operations"""
    queryset = Amenity.objects.all()
    serializer_class = AdminAmenitySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Filter amenities by search query if provided"""
        queryset = Amenity.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(category__icontains=search)
            )
        return queryset.order_by('category', 'name')


class AdminRoomAvailabilityViewSet(viewsets.ModelViewSet):
    """Admin viewset for RoomAvailability CRUD operations"""
    queryset = RoomAvailability.objects.all()
    serializer_class = AdminRoomAvailabilitySerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Filter by accommodation and date range if provided"""
        queryset = RoomAvailability.objects.select_related('accommodation')
        
        accommodation_id = self.request.query_params.get('accommodation', None)
        if accommodation_id:
            queryset = queryset.filter(accommodation_id=accommodation_id)
        
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            try:
                start_date = date.fromisoformat(start_date)
                queryset = queryset.filter(date__gte=start_date)
            except (ValueError, TypeError):
                pass
        
        if end_date:
            try:
                end_date = date.fromisoformat(end_date)
                queryset = queryset.filter(date__lte=end_date)
            except (ValueError, TypeError):
                pass
        
        return queryset.order_by('date', 'accommodation')
    
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """Bulk create availability entries for a date range"""
        accommodation_id = request.data.get('accommodation')
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        status_value = request.data.get('status', 'available')
        price = request.data.get('price', None)
        
        if not all([accommodation_id, start_date_str, end_date_str]):
            return Response(
                {'error': 'accommodation, start_date, and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            accommodation = Accommodation.objects.get(id=accommodation_id)
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except Accommodation.DoesNotExist:
            return Response(
                {'error': 'Accommodation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if end_date <= start_date:
            return Response(
                {'error': 'end_date must be after start_date'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_count = 0
        current_date = start_date
        
        while current_date < end_date:
            RoomAvailability.objects.update_or_create(
                accommodation=accommodation,
                date=current_date,
                defaults={
                    'status': status_value,
                    'price': price if price is not None else None
                }
            )
            created_count += 1
            current_date += timedelta(days=1)
        
        return Response({
            'message': f'{created_count} availability entries created',
            'count': created_count
        }, status=status.HTTP_201_CREATED)


