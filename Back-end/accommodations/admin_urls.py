from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminAccommodationViewSet,
    AdminAmenityViewSet,
    AdminRoomAvailabilityViewSet
)

router = DefaultRouter()
router.register(r'accommodations', AdminAccommodationViewSet, basename='admin-accommodation')
router.register(r'amenities', AdminAmenityViewSet, basename='admin-amenity')
router.register(r'room-availability', AdminRoomAvailabilityViewSet, basename='admin-room-availability')

urlpatterns = router.urls




