"""
URL configuration for sso_integration app.
"""
from django.urls import path
from .views import injast_callback_view, injast_user_info_view

app_name = 'sso_integration'

urlpatterns = [
    path('injast/callback/', injast_callback_view, name='injast_callback'),
    path('injast/user-info/', injast_user_info_view, name='injast_user_info'),
]

