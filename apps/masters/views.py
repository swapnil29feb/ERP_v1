from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from apps.masters.models.product import Product
from apps.masters.models.driver import Driver
from apps.masters.models.accessory import Accessory
from .serializers import ProductSerializer, DriverSerializer, AccessorySerializer


class ProductListAPI(ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
class DriverListAPI(ListCreateAPIView):
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    
class AccessoryListAPI(ListCreateAPIView):
    queryset = Accessory.objects.all()
    serializer_class = AccessorySerializer