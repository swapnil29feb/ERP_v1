from rest_framework.routers import DefaultRouter
from .views import ProductListAPI, DriverListAPI, AccessoryListAPI

router = DefaultRouter()

router.register(r"products", ProductListAPI, basename="products")
router.register(r"drivers", DriverListAPI, basename="drivers")
router.register(r"accessories", AccessoryListAPI, basename="accessories")

urlpatterns = router.urls