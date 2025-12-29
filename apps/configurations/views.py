from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .models import LightingConfiguration, ConfigurationAccessory
from .serializers import LightingConfigurationSerializer, ConfigurationAccessorySerializer


class LightingConfigurationListAPI(ModelViewSet):
    queryset = LightingConfiguration.objects.select_related(
        "area", "product", "driver"
    )
    serializer_class = LightingConfigurationSerializer
    
    @action(
        detail=True,
        methods=["get", 'post'],
        url_path="accessories"
    )
    def accessories(self, request, pk=None):
        """
        GET  /api/configurations/{id}/accessories/
        POST /api/configurations/{id}/accessories/
        """
        if request.method == "GET":
            accessories = ConfigurationAccessory.objects.filter(
                configuration_id=pk
            )
            serializer = ConfigurationAccessorySerializer(
                accessories, many=True
            )
            return Response(serializer.data)

        if request.method == "POST":
            data = request.data.copy()
            data["configuration"] = pk

            serializer = ConfigurationAccessorySerializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class ConfigurationAccessoryListAPI(ModelViewSet):
    queryset = ConfigurationAccessory.objects.select_related(
        "configuration",
        "accessory"
    )
    serializer_class = ConfigurationAccessorySerializer