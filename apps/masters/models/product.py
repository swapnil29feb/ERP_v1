from django.db import models
import random
from decimal import Decimal


class Product(models.Model):
    prod_id = models.AutoField(primary_key=True)
    make = models.CharField(max_length=100)
    order_code = models.CharField(max_length=100, unique=True)

    luminaire_color_ral = models.CharField(max_length=100, null=True, blank=True)
    characteristics = models.TextField(null=True, blank=True)

    diameter_mm = models.IntegerField(null=True, blank=True)
    length_mm = models.IntegerField(null=True, blank=True)
    width_mm = models.IntegerField(null=True, blank=True)
    height_mm = models.IntegerField(null=True, blank=True)

    mounting_style = models.CharField(
        max_length=15,
        choices=[
            ('SURFACE', 'Surface Mounted'),
            ('RECESSED', 'Recessed'),
            ('INGROUND', 'Inground Mounted'),
            ('TRACK MOUNTED', 'Track Mounted'),
        ],
        default='SURFACE',
        null=True,
        blank=True
    )
    beam_angle_degree = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    ip_class = models.IntegerField(null=True, blank=True)

    wattage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    op_voltage = models.IntegerField(null=True, blank=True)
    op_current = models.IntegerField(null=True, blank=True)

    lumen_output = models.IntegerField(null=True, blank=True)
    cct_kelvin = models.IntegerField(null=True, blank=True)
    cri_cci = models.IntegerField(null=True, blank=True)
    lumen_efficency = models.DecimalField(max_digits=5,decimal_places=2, null=True, blank=True)

    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    warranty_years = models.IntegerField(null=True, blank=True)

    website_link = models.URLField(null=True, blank=True)
    visual_image = models.ImageField(upload_to='lighting_specs/images/', null=True, blank=True)

    base_price = models.DecimalField(
        max_digits= 10,
        decimal_places= 2,
        # default= Decimal("1.00")
        default= random.randint(1,99)
    )
    DRIVER_INTEGRATION_CHOICES = [
        ('INTEGRATED', 'Integrated Driver'),
        ('EXTERNAL', 'External Driver'),
    ]

    driver_integration = models.CharField(
        max_length=15,
        choices=DRIVER_INTEGRATION_CHOICES,
        default='EXTERNAL'
    )
    
    def __str__(self):
        return f"{self.make} - {self.order_code}"
