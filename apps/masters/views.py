from rest_framework.viewsets import ModelViewSet
from apps.masters.models.product import Product
from apps.masters.models.driver import Driver
from apps.masters.models.accessory import Accessory
from .serializers import (
    ProductSerializer,
    DriverSerializer,
    AccessorySerializer)


class ProductListAPI(ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
class DriverListAPI(ModelViewSet):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    
class AccessoryListAPI(ModelViewSet):
    queryset = Accessory.objects.all()
    serializer_class = AccessorySerializer