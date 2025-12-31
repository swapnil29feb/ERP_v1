from rest_framework.routers import DefaultRouter
from .views import ProductListAPI, DriverListAPI, AccessoryListAPI

router = DefaultRouter()

router.register("products", ProductListAPI, basename="products")
router.register("drivers", DriverListAPI, basename="drivers")
router.register("accessories", AccessoryListAPI, basename="accessories")

urlpatterns = router.urls