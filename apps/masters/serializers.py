from rest_framework import serializers
from apps.masters.models import Product, Driver, Accessory
from decimal import Decimal, InvalidOperation


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = '__all__'


class AccessorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Accessory
        fields = '__all__'
        
        
class ProductSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            'prod_id',
            'make',
            'order_code',
            'wattage',
            'lumen_output',
        )
        
class DriverSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = [
            "id",
            "driver_code",
            "driver_make",
            "driver_type",
            "dimmable",
            "max_wattage"
        ]
        
class AccessorySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Accessory
        fields = [
            "id",
            "accessory_name",
            "accessory_type"
        ]