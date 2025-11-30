from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminReservationViewSet

router = DefaultRouter()
router.register(r'reservations', AdminReservationViewSet, basename='admin-reservation')

urlpatterns = router.urls


