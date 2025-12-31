from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .models import Project, Area
from .serializers import ProjectSerializer, AreaSerializer


class ProjectViewSet(ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    @action(detail=True, methods=["get", "post"])
    def areas(self, request, pk=None):
        project = self.get_object()

        # GET → list areas of project
        if request.method == "GET":
            areas = project.areas.all()
            serializer = AreaSerializer(areas, many=True)
            return Response(serializer.data)

        # POST → create area under project
        serializer = AreaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
