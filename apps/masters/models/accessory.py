from django.db import models


class Accessory(models.Model):
    accessory_name = models.CharField(max_length=100)
    accessory_type = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.accessory_name