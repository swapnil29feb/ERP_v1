from rest_framework.routers import DefaultRouter
from django.urls import path
from apps.projects.views import ProjectViewSet, AreaViewSet, SubAreaViewSet, project_search

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"areas", AreaViewSet, basename="area")
router.register(r"subareas", SubAreaViewSet, basename="subarea")

urlpatterns = router.urls + [
    path("search/", project_search, name="project-search"),
]
