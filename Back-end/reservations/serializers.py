from rest_framework import serializers
from .models import Reservation
from accommodations.serializers import AccommodationListSerializer


class ReservationListSerializer(serializers.ModelSerializer):
    """Serializer for reservation list view"""
    accommodation_title = serializers.CharField(source='accommodation.title', read_only=True)
    accommodation = AccommodationListSerializer(read_only=True)
    nights = serializers.IntegerField(source='get_nights', read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=0, coerce_to_string=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'accommodation', 'accommodation_title', 'check_in_date', 
            'check_out_date', 'number_of_guests', 'nights', 'total_price', 
            'status', 'contact_phone', 'contact_email', 'created_at'
        ]


class ReservationSerializer(serializers.ModelSerializer):
    """Serializer for reservation detail and CRUD operations"""
    accommodation_title = serializers.CharField(source='accommodation.title', read_only=True)
    accommodation_detail = AccommodationListSerializer(source='accommodation', read_only=True)
    nights = serializers.IntegerField(source='get_nights', read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=0, coerce_to_string=True, read_only=True)
    price_breakdown = serializers.SerializerMethodField()
    contact_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    contact_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'accommodation', 'accommodation_title', 'accommodation_detail',
            'check_in_date', 'check_out_date', 'number_of_guests', 'nights',
            'total_price', 'price_breakdown', 'status', 'contact_phone', 'contact_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'accommodation_title', 'accommodation_detail', 'total_price', 'price_breakdown']
    
    def get_price_breakdown(self, obj):
        """Get detailed price breakdown per day"""
        if obj.pk:  # Only if reservation is saved
            return obj.get_price_breakdown()
        return []
    
    def validate(self, data):
        """Validate reservation data"""
        check_in = data.get('check_in_date', self.instance.check_in_date if self.instance else None)
        check_out = data.get('check_out_date', self.instance.check_out_date if self.instance else None)
        accommodation = data.get('accommodation', self.instance.accommodation if self.instance else None)
        number_of_guests = data.get('number_of_guests', self.instance.number_of_guests if self.instance else None)
        
        if check_in and check_out:
            if check_out <= check_in:
                raise serializers.ValidationError({'check_out_date': 'تاریخ خروج باید بعد از تاریخ ورود باشد'})
        
        if accommodation and number_of_guests:
            if number_of_guests > accommodation.capacity:
                raise serializers.ValidationError({
                    'number_of_guests': f'تعداد مهمان نمی‌تواند بیشتر از ظرفیت اقامتگاه ({accommodation.capacity} نفر) باشد'
                })
        
        return data
    
    def create(self, validated_data):
        """Create reservation and calculate total price"""
        # Use user email as fallback if contact_email not provided
        user = self.context['request'].user
        if not validated_data.get('contact_email') and user.email:
            validated_data['contact_email'] = user.email
        
        reservation = Reservation(**validated_data)
        reservation.total_price = reservation.calculate_total_price()
        reservation.save()
        return reservation
    
    def update(self, instance, validated_data):
        """Update reservation and recalculate total price"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.total_price = instance.calculate_total_price()
        instance.save()
        return instance

