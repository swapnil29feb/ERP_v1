from rest_framework import serializers
from apps.configurations.models import (
    LightingConfiguration,
    ConfigurationAccessory,
    ConfigurationDriver
)
from apps.masters.serializers import ProductSummarySerializer



# class LightingConfigurationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = LightingConfiguration
#         fields = "__all__"
#         read_only_fields = ("project",)

#     def create(self, validated_data):
#         area = validated_data["area"]
#         validated_data["project"] = area.project
#         return super().create(validated_data)

class LightingConfigurationSerializer(serializers.ModelSerializer):
    product_detail = ProductSummarySerializer(
        source = 'product',
        read_only = True
    )
    
    class Meta:
        model = LightingConfiguration
        fields = '__all__'
        read_only_fields = ('project',)
    
    def create(self, validated_data):
        area = validated_data['area']
        validated_data['project'] = area.project
        return super().create(validated_data)

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


class ConfigurationDriverSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(
        source="driver.driver_name",
        read_only=True
    )
    driver_type = serializers.CharField(
        source="driver.driver_type",
        read_only=True
    )
    
    
    class Meta:
        model = ConfigurationDriver
        fields = '__all__'