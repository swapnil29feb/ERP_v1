from rest_framework.routers import DefaultRouter
from .views import LightingConfigurationListAPI, ConfigurationAccessoryListAPI

router = DefaultRouter()
router.register("", LightingConfigurationListAPI, basename="configurations")
router.register(
    "configuration-accessories",
    ConfigurationAccessoryListAPI,
    basename="configuration-accessories"
)


urlpatterns = router.urls