from rest_framework import serializers
from apps.configurations.models import (
    LightingConfiguration,
    ConfigurationAccessory
)


class LightingConfigurationSerializer(serializers.ModelSerializer):
    area_name = serializers.CharField(source="area.name", read_only=True)
    product_code = serializers.CharField(source="product.order_code", read_only=True)
    driver_code = serializers.CharField(
        source="driver.driver_code",
        read_only=True
    )

    class Meta:
        model = LightingConfiguration
        fields = '__all__'


class ConfigurationAccessorySerializer(serializers.ModelSerializer):
    accessory_name = serializers.CharField(
        source="accessory.accessory_name",
        read_only=True
    )
    accessory_type = serializers.CharField(
        source="accessory.accessory_type",
        read_only=True
    )
    
    
    class Meta:
        model = ConfigurationAccessory
        fields = '__all__'
