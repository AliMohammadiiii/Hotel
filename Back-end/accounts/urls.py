from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import login_view, user_info_view, signup_view

app_name = 'accounts'

urlpatterns = [
    path('login/', login_view, name='login'),
    path('signup/', signup_view, name='signup'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', user_info_view, name='user_info'),
]




