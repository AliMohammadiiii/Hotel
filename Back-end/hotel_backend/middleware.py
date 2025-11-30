"""
Custom middleware to add CORS headers to media file responses
"""
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin


class CorsMediaMiddleware(MiddlewareMixin):
    """
    Middleware to add CORS headers to media file responses
    """
    def process_response(self, request, response):
        # Only add CORS headers to media file requests
        if request.path.startswith('/media/'):
            # Get allowed origins from CORS settings
            allowed_origins = [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:8080",
                "http://127.0.0.1:8080",
            ]
            
            origin = request.META.get('HTTP_ORIGIN', '')
            if origin in allowed_origins:
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
                response['Access-Control-Allow-Headers'] = 'Content-Type'
                response['Access-Control-Max-Age'] = '86400'
        
        return response



