from django.db import models
from django.db.models import ProtectedError
from apps.projects.models import Area, Project, SubArea
from apps.masters.models.product import Product
from apps.masters.models.driver import Driver
from apps.masters.models.accessory import Accessory
# from django.utils import timezone, DateTimeField

# created_at = models.DateTimeField(auto_now_add=True)
# updated_at = models.DateTimeField(auto_now=True)

# Create your models here.
class LightingConfiguration(models.Model):
    """
    ERP-grade Configuration Model with Versioning.
    
    Versioning Rules:
    - configuration_version auto-increments per (project, area)
    - Each version is immutable (never updated after creation)
    - is_active marks the current working version
    - (project, area, configuration_version) is unique
    - Deletion is PROHIBITED for audit compliance
    """
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    area = models.ForeignKey(
    Area,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="configurations"
    )
    subarea = models.ForeignKey(
        SubArea,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="configurations"
    )
    
    # ERP Versioning Fields
    configuration_version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    
    # Audit tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        # Ensure (project, area, configuration_version, product) is unique
        unique_together = [('project', 'area', 'configuration_version', 'product')]
        # Index for efficient querying of active versions
        indexes = [
            models.Index(fields=['project', 'area', 'is_active']),
            models.Index(fields=['project', 'area', 'configuration_version']),
        ]
    
    def __str__(self):
        area_name = self.area.name if self.area else "Project-Level"
        product_code = (
            self.product.order_code
            if hasattr(self, "product") and self.product
            else "Unknown Product"
        )
        return f"{area_name} - {product_code} (v{self.configuration_version})"
    
    def delete(self, *args, **kwargs):
        """
        Prevent deletion of configuration versions.
        ERP systems maintain immutable audit trails.
        To deactivate a version, create a new version instead.
        """
        raise ProtectedError(
            "Configuration versions cannot be deleted (ERP audit compliance). "
            "Create a new version instead.",
            self
        )


class ConfigurationAccessory(models.Model):
    """
    Immutable accessory records linked to configuration versions.
    Each version stores complete snapshot of selected accessories.
    """
    configuration = models.ForeignKey(
        LightingConfiguration,
        on_delete=models.CASCADE,
        related_name='accessories'
    )
    accessory = models.ForeignKey(Accessory, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    
    # Audit tracking
    created_at = models.DateTimeField(auto_now_add=True)


class ConfigurationDriver(models.Model):
    """
    Immutable driver records linked to configuration versions.
    Each version stores complete snapshot of selected drivers.
    """
    configuration = models.ForeignKey(
        LightingConfiguration,
        on_delete=models.CASCADE,
        related_name="configuration_drivers"
    )
    driver = models.ForeignKey(Driver, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    
    # Audit tracking
    created_at = models.DateTimeField(auto_now_add=True)