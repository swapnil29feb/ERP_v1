# apps.boq.serailizers.py
from rest_framework import serializers
from .models import BOQ, BOQItem


class BOQSerializer(serializers.ModelSerializer):
    class Meta:
        model = BOQ
        fields = '__all__'
    
    def to_representation(self, instance):
        """Include configuration version info in response"""
        data = super().to_representation(instance)
        if instance.source_configuration_version:
            data['source_configuration_version'] = instance.source_configuration_version
        return data


class BOQItemSerializer(serializers.ModelSerializer):
    product_details = serializers.SerializerMethodField()
    driver_details = serializers.SerializerMethodField()
    accessory_details = serializers.SerializerMethodField()
    area_name = serializers.CharField(source='area.name', read_only=True)
    master_price = serializers.SerializerMethodField()

    class Meta:
        model = BOQItem
        fields = [
            "id",
            "item_type",
            "quantity",
            "unit_price",
            "master_price",
            "markup_pct",
            "final_price",
            "area_name",
            "product_details",
            "driver_details",
            "accessory_details",
        ]

    def get_master_price(self, obj):
        if obj.item_type == 'PRODUCT' and obj.product:
            return obj.product.base_price
        elif obj.item_type == 'DRIVER' and obj.driver:
            return obj.driver.base_price
        elif obj.item_type == 'ACCESSORY' and obj.accessory:
            return obj.accessory.base_price
        return None

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
                "constant_type": obj.driver.constant_type,
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
    
class BOQItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = BOQItem
        fields = [
            "boq",
            "area",
            "item_type",
            "product",
            "driver",
            "accessory",
            "quantity",
            "unit_price",
            "markup_pct",
            "final_price",
        ]

    def validate(self, attrs):
        item_type = attrs.get("item_type")
        boq = attrs.get("boq")
        area = attrs.get("area")

        # 🔒 Duplicate PRODUCT prevention
        if item_type == "PRODUCT":
            product = attrs.get("product")

            if not product:
                raise serializers.ValidationError(
                    {"product": "Product is required for PRODUCT item type."}
                )

            qs = BOQItem.objects.filter(
                boq=boq,
                area=area,
                product=product,
                item_type="PRODUCT",
            )

            if self.instance:
                qs = qs.exclude(id=self.instance.id)

            if qs.exists():
                raise serializers.ValidationError(
                    {
                        "product": (
                            "This product is already added to this area. "
                            "Increase quantity instead of adding it again."
                        )
                    }
                )

        return attrs

class BOQItemPriceUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating BOQItem unit_price (price override).
    Only allows updates when BOQ status is DRAFT.
    Recalculates final_price after override.
    """
    unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=True,
        min_value=0,
        error_messages={
            'required': 'unit_price is required',
            'invalid': 'unit_price must be a valid decimal number',
            'min_value': 'unit_price cannot be negative'
        }
    )

    def validate_unit_price(self, value):
        """Validate that unit_price is positive"""
        if value < 0:
            raise serializers.ValidationError("unit_price cannot be negative")
        return value