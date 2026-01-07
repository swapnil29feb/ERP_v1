from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

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

    def perform_update(self, serializer):
        config = serializer.save()

        # Auto-sync driver quantity
        if hasattr(config, "configuration_driver"):
            driver = config.configuration_driver
            driver.quantity = config.quantity
            driver.save()
    
class ConfigurationAccessoryViewSet(ModelViewSet):
    queryset = ConfigurationAccessory.objects.all()
    serializer_class = ConfigurationAccessorySerializer


class ConfigurationDriverViewSet(ModelViewSet):
    queryset = ConfigurationDriver.objects.all()
    serializer_class = ConfigurationDriverSerializer

    def create(self, request, *args, **kwargs):
        configuration_id = request.data.get("configuration")

        existing = ConfigurationDriver.objects.filter(
            configuration_id=configuration_id
        ).first()

        if existing:
            serializer = self.get_serializer(
                existing,
                data=request.data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data, status=200)

        return super().create(request, *args, **kwargs)