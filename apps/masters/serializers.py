from rest_framework import serializers
from apps.masters.models import Product, Driver, Accessory


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