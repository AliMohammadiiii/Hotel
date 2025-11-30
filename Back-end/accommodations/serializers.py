from rest_framework import serializers
from datetime import date, timedelta
from .models import Accommodation, AccommodationImage, Amenity, RoomAvailability


class AmenitySerializer(serializers.ModelSerializer):
    """Serializer for Amenity model"""
    icon = serializers.SerializerMethodField()
    
    class Meta:
        model = Amenity
        fields = ['id', 'name', 'icon', 'category']
    
    def get_icon(self, obj):
        """Return full URL for icon if exists"""
        if obj.icon:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.icon.url)
            return obj.icon.url
        return None


class RoomAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for RoomAvailability model"""
    effective_price = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomAvailability
        fields = ['id', 'date', 'price', 'status', 'effective_price', 'is_available']
    
    def get_effective_price(self, obj):
        """Return effective price (custom or default)"""
        return str(obj.get_price())
    
    def get_is_available(self, obj):
        """Return availability status"""
        return obj.is_available()


class AccommodationListSerializer(serializers.ModelSerializer):
    """Serializer for accommodation list endpoint"""
    main_image = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    beds = serializers.CharField(source='beds_description', read_only=True)
    rating = serializers.DecimalField(max_digits=3, decimal_places=1, coerce_to_string=False)
    price_per_night = serializers.DecimalField(max_digits=12, decimal_places=0, coerce_to_string=True)
    
    class Meta:
        model = Accommodation
        fields = [
            'id', 'title', 'city', 'province', 'capacity', 'beds',
            'area', 'rating', 'price_per_night', 'main_image', 'images'
        ]
    
    def get_main_image(self, obj):
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None
    
    def get_images(self, obj):
        """Get all images for the accommodation (for carousel in cards)"""
        images = AccommodationImage.objects.filter(accommodation=obj)
        request = self.context.get('request')
        image_urls = []
        
        # First add main_image if it exists
        if obj.main_image:
            if request:
                image_urls.append(request.build_absolute_uri(obj.main_image.url))
            else:
                image_urls.append(obj.main_image.url)
        
        # Then add all additional images
        for img in images:
            if request:
                image_urls.append(request.build_absolute_uri(img.image.url))
            else:
                image_urls.append(img.image.url)
        
        return image_urls


class AccommodationDetailSerializer(serializers.ModelSerializer):
    """Serializer for accommodation detail endpoint"""
    main_image = serializers.SerializerMethodField()
    beds = serializers.CharField(source='beds_description', read_only=True)
    images = serializers.SerializerMethodField()
    amenities = serializers.SerializerMethodField()
    bathroom = serializers.SerializerMethodField()
    rating = serializers.DecimalField(max_digits=3, decimal_places=1, coerce_to_string=False)
    price_per_night = serializers.DecimalField(max_digits=12, decimal_places=0, coerce_to_string=True)
    availability = serializers.SerializerMethodField()
    
    class Meta:
        model = Accommodation
        fields = [
            'id', 'title', 'city', 'province', 'address', 'capacity',
            'beds', 'area', 'bathroom', 'rating', 'price_per_night',
            'description', 'amenities', 'images', 'main_image', 'availability'
        ]
    
    def get_main_image(self, obj):
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None
    
    def get_images(self, obj):
        """Get all images for the accommodation (main_image + additional images)"""
        images = AccommodationImage.objects.filter(accommodation=obj)
        request = self.context.get('request')
        image_urls = []
        
        # First add main_image if it exists
        if obj.main_image:
            if request:
                image_urls.append(request.build_absolute_uri(obj.main_image.url))
            else:
                image_urls.append(obj.main_image.url)
        
        # Then add all additional images
        for img in images:
            if request:
                image_urls.append(request.build_absolute_uri(img.image.url))
            else:
                image_urls.append(img.image.url)
        
        return image_urls
    
    def get_amenities(self, obj):
        """Get list of amenities with full details including icon"""
        request = self.context.get('request')
        amenities = []
        for amenity in obj.amenities.all():
            amenity_data = {
                'id': amenity.id,
                'name': amenity.name,
                'category': amenity.category,
                'icon': None
            }
            if amenity.icon:
                if request:
                    amenity_data['icon'] = request.build_absolute_uri(amenity.icon.url)
                else:
                    amenity_data['icon'] = amenity.icon.url
            amenities.append(amenity_data)
        return amenities
    
    def get_bathroom(self, obj):
        """Extract bathroom information from amenities"""
        bathroom_amenities = obj.amenities.filter(
            category__icontains='سرویس بهداشتی'
        ) | obj.amenities.filter(
            name__icontains='سرویس بهداشتی'
        )
        if bathroom_amenities.exists():
            return '، '.join([a.name for a in bathroom_amenities])
        return None
    
    def get_availability(self, obj):
        """Get availability for a date range if provided in request"""
        request = self.context.get('request')
        if not request:
            return None
        
        # Get date range from query parameters
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if not start_date_str or not end_date_str:
            return None
        
        try:
            start_date = date.fromisoformat(start_date_str)
            end_date = date.fromisoformat(end_date_str)
        except (ValueError, TypeError):
            return None
        
        # Get availability entries for the date range
        availability_entries = RoomAvailability.objects.filter(
            accommodation=obj,
            date__gte=start_date,
            date__lt=end_date
        ).order_by('date')
        
        # Build availability data with prices
        default_price = obj.price_per_night
        availability_data = []
        current_date = start_date
        
        while current_date < end_date:
            # Find specific availability entry for this date
            entry = availability_entries.filter(date=current_date).first()
            
            # Always use default price as base
            day_price = default_price
            has_custom_price = False
            
            if entry:
                # If entry has a custom price set, use it
                if entry.price is not None:
                    day_price = entry.price
                    has_custom_price = True
                
                availability_data.append({
                    'date': current_date.isoformat(),
                    'price': str(day_price),
                    'default_price': str(default_price),
                    'has_custom_price': has_custom_price,
                    'status': entry.status,
                    'is_available': entry.is_available(),
                })
            else:
                # No specific entry, use default price and assume available
                availability_data.append({
                    'date': current_date.isoformat(),
                    'price': str(default_price),
                    'default_price': str(default_price),
                    'has_custom_price': False,
                    'status': 'available',
                    'is_available': True,
                })
            
            current_date += timedelta(days=1)
        
        return availability_data
    
    def availability_by_date_range(self, obj, start_date, end_date):
        """Get availability for a specific date range"""
        availability_entries = RoomAvailability.objects.filter(
            accommodation=obj,
            date__gte=start_date,
            date__lt=end_date
        ).order_by('date')
        
        default_price = obj.price_per_night
        availability_data = []
        current_date = start_date
        
        while current_date < end_date:
            entry = availability_entries.filter(date=current_date).first()
            
            # Always use default price as base
            day_price = default_price
            has_custom_price = False
            
            if entry:
                # If entry has a custom price set, use it
                if entry.price is not None:
                    day_price = entry.price
                    has_custom_price = True
                
                availability_data.append({
                    'date': current_date.isoformat(),
                    'price': str(day_price),
                    'default_price': str(default_price),
                    'has_custom_price': has_custom_price,
                    'status': entry.status,
                    'is_available': entry.is_available(),
                })
            else:
                availability_data.append({
                    'date': current_date.isoformat(),
                    'price': str(default_price),
                    'default_price': str(default_price),
                    'has_custom_price': False,
                    'status': 'available',
                    'is_available': True,
                })
            
            current_date += timedelta(days=1)
        
        return availability_data


# Admin Serializers for CRUD operations

class AdminAmenitySerializer(serializers.ModelSerializer):
    """Admin serializer for Amenity CRUD operations"""
    icon = serializers.SerializerMethodField()
    
    class Meta:
        model = Amenity
        fields = ['id', 'name', 'icon', 'category']
    
    def get_icon(self, obj):
        """Return full URL for icon if exists"""
        if obj.icon:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.icon.url)
            return obj.icon.url
        return None


class AdminRoomAvailabilitySerializer(serializers.ModelSerializer):
    """Admin serializer for RoomAvailability CRUD operations"""
    accommodation_title = serializers.CharField(source='accommodation.title', read_only=True)
    effective_price = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomAvailability
        fields = [
            'id', 'accommodation', 'accommodation_title', 'date', 'price', 
            'status', 'effective_price', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'accommodation_title', 'effective_price', 'is_available']
    
    def get_effective_price(self, obj):
        """Return effective price (custom or default)"""
        return str(obj.get_price())
    
    def get_is_available(self, obj):
        """Return availability status"""
        return obj.is_available()


class AdminAccommodationImageSerializer(serializers.ModelSerializer):
    """Admin serializer for AccommodationImage"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AccommodationImage
        fields = ['id', 'accommodation', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at', 'image_url']
    
    def get_image_url(self, obj):
        """Return full URL for image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class AdminAccommodationSerializer(serializers.ModelSerializer):
    """Admin serializer for Accommodation CRUD operations"""
    main_image_url = serializers.SerializerMethodField()
    images = AdminAccommodationImageSerializer(many=True, read_only=True)
    amenities = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Amenity.objects.all(),
        required=False
    )
    
    class Meta:
        model = Accommodation
        fields = [
            'id', 'title', 'city', 'province', 'address', 'description',
            'capacity', 'beds_description', 'area', 'price_per_night', 'rating',
            'main_image', 'main_image_url', 'amenities', 'images',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'main_image_url']
    
    def get_main_image_url(self, obj):
        """Return full URL for main image"""
        if obj.main_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.main_image.url)
            return obj.main_image.url
        return None
    
    def update(self, instance, validated_data):
        """Handle amenities update"""
        amenities = validated_data.pop('amenities', None)
        instance = super().update(instance, validated_data)
        if amenities is not None:
            instance.amenities.set(amenities)
        return instance

