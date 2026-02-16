from rest_framework.routers import DefaultRouter
from apps.configurations.views import (
    LightingConfigurationListAPI,
    ConfigurationAccessoryViewSet,
    ConfigurationDriverViewSet,
)

router = DefaultRouter()

# Main configuration endpoints
router.register(
    r"",
    LightingConfigurationListAPI,
    basename="configurations"
)

# Driver endpoints
router.register(
    r"configuration-drivers",
    ConfigurationDriverViewSet,
    basename="configuration-driver"
)

# Accessory endpoints
router.register(
    r"configuration-accessories",
    ConfigurationAccessoryViewSet,
    basename="configuration-accessory"
)

urlpatterns = router.urls