from rest_framework import serializers
from apps.configurations.models import (
    LightingConfiguration,
    ConfigurationAccessory,
    ConfigurationDriver
)
from apps.masters.serializers import (
    ProductSummarySerializer,
    DriverSummarySerializer,
    AccessorySummarySerializer,
)


class ConfigurationDriverNestedSerializer(serializers.ModelSerializer):
    driver_detail = DriverSummarySerializer(
        source="driver",
        read_only=True
    )

    class Meta:
        model = ConfigurationDriver
        fields = [
            "id",
            "driver",
            "driver_detail",
            "quantity"
        ]


class ConfigurationAccessoryNestedSerializer(serializers.ModelSerializer):
    accessory_detail = AccessorySummarySerializer(
        source="accessory",
        read_only=True
    )

    class Meta:
        model = ConfigurationAccessory
        fields = [
            "id",
            "accessory",
            "accessory_detail",
            "quantity"
        ]


class LightingConfigurationSerializer(serializers.ModelSerializer):
    product_detail = ProductSummarySerializer(
        source="product",
        read_only=True
    )

    driver = ConfigurationDriverNestedSerializer(
        source="configuration_driver",
        read_only=True
    )

    accessories = ConfigurationAccessoryNestedSerializer(
        source="configurationaccessory_set",
        many=True,
        read_only=True
    )

    # 🔑 CRITICAL: explicitly define subarea
    subarea = serializers.PrimaryKeyRelatedField(
        queryset=LightingConfiguration._meta.get_field("subarea").remote_field.model.objects.all()
    )

    area = serializers.PrimaryKeyRelatedField(
        queryset=LightingConfiguration._meta.get_field("area").remote_field.model.objects.all()
    )

    product = serializers.PrimaryKeyRelatedField(
        queryset=LightingConfiguration._meta.get_field("product").remote_field.model.objects.all()
    )

    class Meta:
        model = LightingConfiguration
        fields = [
            "id",
            "project",
            "area",
            "subarea",          # ✅ REQUIRED
            "product",
            "product_detail",
            "quantity",
            "driver",
            "accessories",
            "configuration_version",
            "is_active",
        ]
        read_only_fields = (
            "project",
            "configuration_version",
            "is_active",
        )

    def create(self, validated_data):
        """
        ERP RULE:
        - project is derived from area
        - area + subarea MUST be preserved
        """
        area = validated_data["area"]
        validated_data["project"] = area.project
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
    constant_type = serializers.CharField(
        source="driver.constant_type",
        read_only=True
    )
    
    
    class Meta:
        model = ConfigurationDriver
        fields = '__all__'
        
    def validate(self, data):
        configuration = data.get("configuration")
        if configuration:
            data['quantity'] = configuration.quantity
        return data
