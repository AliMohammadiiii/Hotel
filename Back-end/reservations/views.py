from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from datetime import timedelta
from accommodations.models import RoomAvailability
from .models import Reservation
from .serializers import ReservationSerializer, ReservationListSerializer


class ReservationListView(generics.ListCreateAPIView):
    """List user's reservations or create a new reservation"""
    permission_classes = [IsAuthenticated]
    serializer_class = ReservationSerializer
    
    def get_queryset(self):
        """Return reservations for the current user"""
        return Reservation.objects.filter(user=self.request.user).select_related('accommodation')
    
    def get_serializer_class(self):
        """Use different serializer for list vs create"""
        if self.request.method == 'GET':
            return ReservationListSerializer
        return ReservationSerializer
    
    def perform_create(self, serializer):
        """Create reservation for the current user and validate availability"""
        reservation = serializer.save(user=self.request.user)
        
        # Update RoomAvailability status for reserved dates
        self._update_availability_status(reservation, 'reserved')
    
    def _update_availability_status(self, reservation, new_status):
        """Update RoomAvailability status for reservation dates"""
        if not reservation.check_in_date or not reservation.check_out_date:
            return
        
        current_date = reservation.check_in_date
        while current_date < reservation.check_out_date:
            RoomAvailability.objects.update_or_create(
                accommodation=reservation.accommodation,
                date=current_date,
                defaults={'status': new_status}
            )
            current_date += timedelta(days=1)


class ReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a reservation"""
    permission_classes = [IsAuthenticated]
    serializer_class = ReservationSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        """Return reservations for the current user only"""
        return Reservation.objects.filter(user=self.request.user).select_related('accommodation')
    
    def get_object(self):
        """Get reservation and ensure it belongs to the current user"""
        queryset = self.get_queryset()
        obj = get_object_or_404(queryset, id=self.kwargs['id'])
        return obj
    
    def perform_update(self, serializer):
        """Update reservation and handle status changes"""
        old_reservation = self.get_object()
        old_status = old_reservation.status
        old_check_in = old_reservation.check_in_date
        old_check_out = old_reservation.check_out_date
        reservation_id = old_reservation.id
        
        reservation = serializer.save()
        new_status = reservation.status
        
        # If dates changed, update availability for both old and new dates
        if old_check_in != reservation.check_in_date or old_check_out != reservation.check_out_date:
            # Release old dates
            self._release_dates(old_reservation.accommodation, old_check_in, old_check_out, exclude_reservation_id=reservation_id)
            # Reserve new dates
            self._update_availability_status(reservation, 'reserved')
        elif old_status != new_status:
            # Status changed, update availability accordingly
            if new_status == 'confirmed':
                self._update_availability_status(reservation, 'reserved')
            elif new_status == 'cancelled':
                self._release_dates(reservation.accommodation, reservation.check_in_date, reservation.check_out_date, exclude_reservation_id=reservation_id)
            elif new_status == 'pending' and old_status == 'confirmed':
                # Downgrade from confirmed, keep as reserved
                self._update_availability_status(reservation, 'reserved')
    
    def perform_destroy(self, instance):
        """Release dates when reservation is deleted"""
        self._release_dates(instance.accommodation, instance.check_in_date, instance.check_out_date, exclude_reservation_id=instance.id)
        instance.delete()
    
    def _update_availability_status(self, reservation, new_status):
        """Update RoomAvailability status for reservation dates"""
        if not reservation.check_in_date or not reservation.check_out_date:
            return
        
        current_date = reservation.check_in_date
        while current_date < reservation.check_out_date:
            RoomAvailability.objects.update_or_create(
                accommodation=reservation.accommodation,
                date=current_date,
                defaults={'status': new_status}
            )
            current_date += timedelta(days=1)
    
    def _release_dates(self, accommodation, check_in_date, check_out_date, exclude_reservation_id=None):
        """Release dates back to available status"""
        if not check_in_date or not check_out_date:
            return
        
        current_date = check_in_date
        while current_date < check_out_date:
            # Check if there are other reservations for this date
            other_reservations_query = Reservation.objects.filter(
                accommodation=accommodation,
                status__in=['pending', 'confirmed'],
                check_in_date__lt=current_date + timedelta(days=1),
                check_out_date__gt=current_date
            )
            
            if exclude_reservation_id:
                other_reservations_query = other_reservations_query.exclude(id=exclude_reservation_id)
            
            if not other_reservations_query.exists():
                # No other reservations, set back to available
                RoomAvailability.objects.update_or_create(
                    accommodation=accommodation,
                    date=current_date,
                    defaults={'status': 'available'}
                )
            else:
                # Other reservations exist, keep as reserved
                RoomAvailability.objects.update_or_create(
                    accommodation=accommodation,
                    date=current_date,
                    defaults={'status': 'reserved'}
                )
            
            current_date += timedelta(days=1)
