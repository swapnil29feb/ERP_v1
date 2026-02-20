from decimal import Decimal
from django.db.models import F, Sum
from apps.boq.models import BOQ, BOQItem


def calculate_totals(boq):
    items = BOQItem.objects.filter(boq=boq)

    subtotal = items.aggregate(
        total=Sum(F("unit_price") * F("quantity"))
    )["total"] or Decimal("0.00")

    grand_total = items.aggregate(
        total=Sum("final_price")
    )["total"] or Decimal("0.00")

    return subtotal, grand_total


def compare_boq_versions(project_id, v1, v2):

    boq1 = BOQ.objects.get(project_id=project_id, version=v1)
    boq2 = BOQ.objects.get(project_id=project_id, version=v2)

    subtotal1, grand1 = calculate_totals(boq1)
    subtotal2, grand2 = calculate_totals(boq2)

    header_diff = {
        "subtotal": {
            "old": subtotal1,
            "new": subtotal2,
            "difference": subtotal2 - subtotal1,
        },
        "grand_total": {
            "old": grand1,
            "new": grand2,
            "difference": grand2 - grand1,
        },
    }

    items1 = {
        item.product_id: item
        for item in BOQItem.objects.select_related("product", "area")
        .filter(boq=boq1, item_type="PRODUCT")
    }

    items2 = {
        item.product_id: item
        for item in BOQItem.objects.select_related("product", "area")
        .filter(boq=boq2, item_type="PRODUCT")
    }

    all_keys = sorted(set(items1.keys()).union(set(items2.keys())))

    comparison = []

    for key in all_keys:
        old = items1.get(key)
        new = items2.get(key)

        source = old if old else new

        product_name = source.product.order_code if source and source.product else None
        area_name = source.area.name if source and source.area else None

        if old and new:

            changed = (
                old.quantity != new.quantity or
                old.unit_price != new.unit_price or
                old.final_price != new.final_price
            )

            status = "MODIFIED" if changed else "UNCHANGED"

            comparison.append({
                "product_id": key,
                "product_name": product_name,
                "area_name": area_name,
                "status": status,
                "old": {
                    "quantity": old.quantity,
                    "unit_price": old.unit_price,
                    "final_price": old.final_price,
                },
                "new": {
                    "quantity": new.quantity,
                    "unit_price": new.unit_price,
                    "final_price": new.final_price,
                }
            })

        elif old and not new:
            comparison.append({
                "product_id": key,
                "product_name": product_name,
                "area_name": area_name,
                "status": "REMOVED",
                "old": {
                    "quantity": old.quantity,
                    "unit_price": old.unit_price,
                    "final_price": old.final_price,
                },
                "new": None
            })

        elif new and not old:
            comparison.append({
                "product_id": key,
                "product_name": product_name,
                "area_name": area_name,
                "status": "ADDED",
                "old": None,
                "new": {
                    "quantity": new.quantity,
                    "unit_price": new.unit_price,
                    "final_price": new.final_price,
                }
            })

    return {
        "version_1": boq1.version,
        "version_2": boq2.version,
        "header_diff": header_diff,
        "items": comparison,
    }
