from django.urls import path
from .views import AccommodationListView, AccommodationDetailView, filter_options_view, unavailable_dates_view, check_holiday_view, availability_calendar_view

app_name = 'accommodations'

urlpatterns = [
    path('', AccommodationListView.as_view(), name='list'),
    path('<int:id>/', AccommodationDetailView.as_view(), name='detail'),
    path('<int:id>/unavailable-dates/', unavailable_dates_view, name='unavailable-dates'),
    path('<int:id>/availability-calendar/', availability_calendar_view, name='availability-calendar'),
    path('filters/', filter_options_view, name='filters'),
    path('holiday/check/', check_holiday_view, name='check-holiday'),
]





