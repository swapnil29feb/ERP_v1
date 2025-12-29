from django.db import models
from apps.projects.models import Area, Project
from apps.masters.models.product import Product
from apps.masters.models.driver import Driver
from apps.masters.models.accessory import Accessory


# Create your models here.
class LightingConfiguration(models.Model):
    area = models.ForeignKey(
        Area,
        on_delete=models.CASCADE,
        related_name='lighting_configurations'
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    driver = models.ForeignKey(
        Driver,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )
    quantity = models.PositiveIntegerField()
    
    def __str__(self):
        return f"{self.area.name} - {self.product.order_code}"


class ConfigurationAccessory(models.Model):
    configuration = models.ForeignKey(LightingConfiguration, on_delete=models.CASCADE)
    accessory = models.ForeignKey(Accessory, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
