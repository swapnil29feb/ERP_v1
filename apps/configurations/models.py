from django.db import models
from apps.projects.models import Area, Project
from apps.masters.models.product import Product
from apps.masters.models.driver import Driver
from apps.masters.models.accessory import Accessory


# Create your models here.
class LightingConfiguration(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        editable=False
    )
    area = models.ForeignKey(Area, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    
    def __str__(self):
        return f"{self.area.name} - {self.product.order_code}"


class ConfigurationAccessory(models.Model):
    configuration = models.ForeignKey(LightingConfiguration, on_delete=models.CASCADE)
    accessory = models.ForeignKey(Accessory, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()


class ConfigurationDriver(models.Model):
    configuration = models.OneToOneField(
        LightingConfiguration,
        on_delete=models.CASCADE,
        related_name="configuration_driver"
    )
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()