from django.db import models
import random

class Accessory(models.Model):
    accessory_name = models.CharField(max_length=100)
    accessory_type = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    base_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=random.randint(1,99)
    )
    
    def __str__(self):
        return self.accessory_name