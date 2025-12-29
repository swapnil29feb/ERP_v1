from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Project, Area
from .serializers import ProjectSerializer, AreaSerializer


class ProjectViewSet(ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    @action(detail=True, methods=["get"])
    def areas(self, request, pk=None):
        project = self.get_object()
        serializer = AreaSerializer(project.areas.all(), many=True)
        return Response(serializer.data)