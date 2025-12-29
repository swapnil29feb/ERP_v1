from rest_framework.routers import DefaultRouter
from apps.projects.views import ProjectViewSet

router = DefaultRouter()
router.register("", ProjectViewSet, basename="projects")

urlpatterns = router.urls