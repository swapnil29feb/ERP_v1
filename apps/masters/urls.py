from django.urls import path
from .views import ProductListAPI, DriverListAPI, AccessoryListAPI

urlpatterns = [
    path('products/', ProductListAPI.as_view(), name='product-list'),
    path('drivers/', DriverListAPI.as_view(), name='driver-list'),
    path('accessories/', AccessoryListAPI.as_view(), name='accessory-list'),
]
