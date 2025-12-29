from django.db import models

class Driver(models.Model):
    driver_code = models.CharField(max_length=100, unique=True)
    driver_make = models.CharField(max_length=100)
    driver_type = models.CharField(max_length=50)

    input_voltage_range = models.CharField(max_length=100, null=True, blank=True)
    max_wattage = models.IntegerField(null=True, blank=True)

    dimmable = models.CharField(
        max_length=3,
        choices=[('YES', 'Yes'), ('NO', 'No')],
        default='YES'
    )

    def __str__(self):
        return f"{self.driver_make} - {self.driver_code}"