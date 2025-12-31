from rest_framework.routers import DefaultRouter
from apps.projects.views import ProjectViewSet

router = DefaultRouter()
router.register("", ProjectViewSet, basename="projects")
# router.register("area", AreaViewSet, basename="areas")

urlpatterns = router.urls