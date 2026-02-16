from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.openapi import AutoSchema
from drf_spectacular.utils import extend_schema


@extend_schema(tags=["Auth"])
class ERPTokenObtainPairView(TokenObtainPairView):
    schema = AutoSchema()


@extend_schema(tags=["Auth"])
class ERPTokenRefreshView(TokenRefreshView):
    schema = AutoSchema()