from django.db import models
from apps.projects.models import Project, Area
from apps.masters.models import Product, Driver, Accessory


class BOQ(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    version = models.PositiveIntegerField()
    status = models.CharField(
        max_length=10,
        choices=[("DRAFT", "Draft"), ("FINAL", "Final")],
        default="DRAFT"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    locked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("project", "version")


    
class BOQItem(models.Model):
    boq = models.ForeignKey(BOQ, on_delete=models.CASCADE, related_name="items")
    area = models.ForeignKey(Area, on_delete=models.CASCADE)

    item_type = models.CharField(
        max_length=20,
        choices=[("PRODUCT", "Product"), ("DRIVER", "Driver"), ("ACCESSORY", "Accessory")]
    )

    product = models.ForeignKey(
        Product,
        null=True,
        blank=True,
        on_delete=models.PROTECT
    )
    driver = models.ForeignKey(
        Driver,
        null=True,
        blank=True,
        on_delete=models.PROTECT
    )
    accessory = models.ForeignKey(
        Accessory,
        null=True,
        blank=True,
        on_delete=models.PROTECT
    )

    quantity = models.PositiveIntegerField()

    # 🔽 COMMERCIAL SNAPSHOT
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    markup_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=12, decimal_places=2)

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