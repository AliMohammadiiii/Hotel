"""
URL configuration for hotel_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.http import HttpResponse

def serve_media_with_cors(request, path):
    """Serve media files with CORS headers"""
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]
    
    origin = request.META.get('HTTP_ORIGIN', '')
    
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = HttpResponse()
        if origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type'
            response['Access-Control-Max-Age'] = '86400'
        return response
    
    # Serve the actual file
    response = serve(request, path, document_root=settings.MEDIA_ROOT)
    
    if origin in allowed_origins:
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        response['Access-Control-Max-Age'] = '86400'
    
    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/auth/', include('sso_integration.urls')),
    path('api/accommodations/', include('accommodations.urls')),
    path('api/reservations/', include('reservations.urls')),
    path('api/admin/', include('accommodations.admin_urls')),
    path('api/admin/', include('reservations.admin_urls')),
]

# Serve media files in development with CORS headers
if settings.DEBUG:
    urlpatterns += [
        path('media/<path:path>', serve_media_with_cors, name='media'),
    ]
