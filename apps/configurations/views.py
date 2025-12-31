from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .models import (
    LightingConfiguration,
    ConfigurationAccessory,
    ConfigurationDriver
)
from .serializers import (
    LightingConfigurationSerializer,
    ConfigurationAccessorySerializer,
    ConfigurationDriverSerializer
)


class LightingConfigurationListAPI(ModelViewSet):
    queryset = LightingConfiguration.objects.all()
    serializer_class = LightingConfigurationSerializer

    @action(detail=False, methods=["get"], url_path="by-area/(?P<area_id>[^/.]+)")
    def by_area(self, request, area_id=None):
        configs = self.queryset.filter(area_id=area_id)
        serializer = self.get_serializer(configs, many=True)
        return Response(serializer.data)
    
class ConfigurationAccessoryViewSet(ModelViewSet):
    queryset = ConfigurationAccessory.objects.all()
    serializer_class = ConfigurationAccessorySerializer


class ConfigurationDriverViewSet(ModelViewSet):
    queryset = ConfigurationDriver.objects.all()
    serializer_class = ConfigurationDriverSerializer
