from rest_framework import serializers
from .models import BOQ, BOQItem


class BOQSerializer(serializers.ModelSerializer):
    class Meta:
        model = BOQ
        fields = '__all__'


class BOQItemSerializer(serializers.ModelSerializer):
    product_details = serializers.SerializerMethodField()
    driver_details = serializers.SerializerMethodField()
    accessory_details = serializers.SerializerMethodField()

    class Meta:
        model = BOQItem
        fields = [
            "id",
            "item_type",
            "quantity",
            "product_details",
            "driver_details",
            "accessory_details",
        ]

    def get_product_details(self, obj):
        if obj.product:
            return {
                "name": obj.product.make,
                "order_code": obj.product.order_code,
                "wattage": obj.product.wattage,
                "lumen_output": obj.product.lumen_output,
            }
        return None

    def get_driver_details(self, obj):
        if obj.driver:
            return {
                "driver_code": obj.driver.driver_code,
                "driver_type": obj.driver.driver_type,
                "dimmable": obj.driver.dimmable,
            }
        return None

    def get_accessory_details(self, obj):
        if obj.accessory:
            return {
                "name": obj.accessory.accessory_name,
                "type": obj.accessory.accessory_type,
            }
        return None