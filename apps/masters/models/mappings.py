from django.db import models
from .product import Product
from .driver import Driver
from .accessory import Accessory


class ProductDriverMap(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"Product: {self.product.order_code} - Driver: {self.driver.driver_code}"
    

class ProductAccessoryMap(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    accessory = models.ForeignKey(Accessory, on_delete=models.CASCADE)
    is_mandatory = models.BooleanField(default=False)