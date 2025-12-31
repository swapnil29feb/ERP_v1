from rest_framework.routers import DefaultRouter
from apps.configurations.views import (
    LightingConfigurationListAPI,
    ConfigurationAccessoryViewSet,
    ConfigurationDriverViewSet,
)

router = DefaultRouter()

router.register(
    "configurations",
    LightingConfigurationListAPI,
    basename="configurations"
)

router.register(
    "configuration-accessories",
    ConfigurationAccessoryViewSet,
    basename="configuration-accessories"
)

router.register(
    "configuration-drivers",
    ConfigurationDriverViewSet,
    basename="configuration-drivers"
)

urlpatterns = router.urls
