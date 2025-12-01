from rest_framework import viewsets, status
from rest_framework.decorators import action, authentication_classes, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Q
from datetime import date
from .models import Reservation
from accounts.authentication import AdminJWTAuthentication
from .serializers import ReservationListSerializer, ReservationSerializer


@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAdminUser])
class AdminReservationViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin viewset for Reservation management (read-only with status update)"""
    queryset = Reservation.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ReservationListSerializer
        return ReservationSerializer
    
    def get_queryset(self):
        """Filter reservations by various criteria"""
        queryset = Reservation.objects.select_related('accommodation', 'user').all()
        
        # Status filter
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Accommodation filter
        accommodation_id = self.request.query_params.get('accommodation', None)
        if accommodation_id:
            queryset = queryset.filter(accommodation_id=accommodation_id)
        
        # Date range filter
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            try:
                start_date = date.fromisoformat(start_date)
                queryset = queryset.filter(check_in_date__gte=start_date)
            except (ValueError, TypeError):
                pass
        
        if end_date:
            try:
                end_date = date.fromisoformat(end_date)
                queryset = queryset.filter(check_out_date__lte=end_date)
            except (ValueError, TypeError):
                pass
        
        # Search filter
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search) |
                Q(accommodation__title__icontains=search) |
                Q(contact_email__icontains=search) |
                Q(contact_phone__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """Update reservation status"""
        reservation = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = ['pending', 'confirmed', 'cancelled']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'status must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reservation.status = new_status
        reservation.save()
        
        serializer = ReservationSerializer(reservation, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], url_path='update')
    def update_reservation(self, request, pk=None):
        """Partial update reservation (admin can update any field)"""
        reservation = self.get_object()
        serializer = ReservationSerializer(
            reservation,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

