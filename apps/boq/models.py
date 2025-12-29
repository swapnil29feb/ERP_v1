from django.db import models
from apps.projects.models import Project, Area
from apps.masters.models import Product, Driver, Accessory


class BOQ(models.Model):

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('APPROVED', 'Approved'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'version')
        ordering = ['-version']

    def __str__(self):
        return f"BOQ v{self.version} ({self.project.name})"

    
class BOQItem(models.Model):
    ITEM_TYPE_CHOICES = [
        ("PRODUCT", "Product"),
        ("DRIVER", "Driver"),
        ("ACCESSORY", "Accessory"),
    ]

    boq = models.ForeignKey(
        BOQ,
        on_delete=models.CASCADE,
        related_name="items"
    )
    area = models.ForeignKey(
        Area,
        on_delete=models.CASCADE
    )

    item_type = models.CharField(
        max_length=20,
        choices=ITEM_TYPE_CHOICES
    )

    # Generic references (only one used based on item_type)
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )
    driver = models.ForeignKey(
        Driver,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )
    accessory = models.ForeignKey(
        Accessory,
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    quantity = models.PositiveIntegerField()

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(item_type="PRODUCT", product__isnull=False) |
                    models.Q(item_type="DRIVER", driver__isnull=False) |
                    models.Q(item_type="ACCESSORY", accessory__isnull=False)
                ),
                name="boq_item_type_reference_check"
            )
        ]