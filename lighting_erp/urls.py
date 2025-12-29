from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Swagger / OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),

    # ERP APIs
    path('api/masters/', include('apps.masters.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/configurations/', include('apps.configurations.urls')),
    path('api/boq/', include('apps.boq.urls')),
]
