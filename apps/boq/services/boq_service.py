import math
from django.db.models import Sum
from django.db import transaction
from apps.boq.models import BOQ, BOQItem
from apps.configurations.models import (
    LightingConfiguration,
    ConfigurationAccessory,
)
from django.core.exceptions import ValidationError


def generate_boq(project):
    """
    Generate BOQ for a project
    Area-wise
    Product → Driver → Accessory
    """

    boq = BOQ.objects.create(project=project)

    configurations = LightingConfiguration.objects.select_related(
        "area", "product", "driver"
    ).filter(area__project=project)

    for config in configurations:
        area = config.area
        product = config.product

        # 1️⃣ PRODUCT BOQ ITEM
        BOQItem.objects.create(
            boq=boq,
            area=area,
            item_type="PRODUCT",
            product=product,
            quantity=config.quantity,
        )

        # 2️⃣ DRIVER BOQ ITEM (if external)
        if product.driver_integration == "EXTERNAL" and config.driver:

            if product.linear == "YES" and product.length_mm:
                total_length_m = (config.quantity * product.length_mm) / 1000
                driver_qty = max(1, math.ceil(total_length_m / 5))
            else:
                driver_qty = config.quantity

            BOQItem.objects.create(
                boq=boq,
                area=area,
                item_type="DRIVER",
                driver=config.driver,
                quantity=driver_qty,
            )

        # 3️⃣ ACCESSORY BOQ ITEMS
        accessories = ConfigurationAccessory.objects.filter(
            configuration=config
        )

        for acc in accessories:
            BOQItem.objects.create(
                boq=boq,
                area=area,
                item_type="ACCESSORY",
                accessory=acc.accessory,
                quantity=acc.quantity * config.quantity,
            )

    return boq


def get_project_boq_summary(project):
    """
    Returns project-wise BOQ summary
    Aggregated by item_type and item_id
    Uses latest BOQ
    """

    boq = (
        BOQ.objects
        .filter(project=project)
        .order_by('-created_at')
        .first()
    )

    if not boq:
        return None

    items = (
        BOQItem.objects
        .filter(boq=boq)
        .values('item_type', 'item_id')
        .annotate(total_qty=Sum('quantity'))
        .order_by('item_type', 'item_id')
    )

    summary = {
        'PRODUCT': [],
        'DRIVER': [],
        'ACCESSORY': [],
    }

    for item in items:
        summary[item['item_type']].append({
            'item_id': item['item_id'],
            'quantity': item['total_qty']
        })

    return {
        'project_id': project.id,
        'boq_id': boq.id,
        'summary': summary
    }
    

def approve_boq(boq):
    """
    Approve a BOQ.
    Rules:
    - Only DRAFT BOQ can be approved
    - Approved BOQ becomes immutable
    """

    if boq.status != 'DRAFT':
        raise ValidationError(
            f"BOQ v{boq.version} is already {boq.status}"
        )

    with transaction.atomic():
        boq.status = 'APPROVED'
        boq.save(update_fields=['status'])

    return boq