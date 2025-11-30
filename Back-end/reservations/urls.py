from django.urls import path
from .views import ReservationListView, ReservationDetailView

app_name = 'reservations'

urlpatterns = [
    path('', ReservationListView.as_view(), name='list'),
    path('<int:id>/', ReservationDetailView.as_view(), name='detail'),
]




