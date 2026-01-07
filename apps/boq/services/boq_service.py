import math
# from time import timezone
from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal
from django.db import transaction
from apps.boq.models import BOQ, BOQItem
from apps.configurations.models import (
    LightingConfiguration,
    ConfigurationAccessory,
)
from django.core.exceptions import ValidationError
from decimal import Decimal
from django.db import transaction
from apps.boq.models import BOQ, BOQItem
from apps.configurations.models import LightingConfiguration, ConfigurationAccessory
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from decimal import Decimal
from datetime import date

import openpyxl
from openpyxl.styles import Font, Alignment, numbers
from openpyxl.utils import get_column_letter
from decimal import Decimal
from datetime import date
from django.http import HttpResponse


class BOQPDFBuilder:
    def __init__(self, boq):
        self.boq = boq
        self.width, self.height = A4
        self.y = self.height - 40

        self.response = HttpResponse(content_type="application/pdf")
        self.response["Content-Disposition"] = (
            f'attachment; filename="BOQ_{boq.project.name}_V{boq.version}.pdf"'
        )

        self.c = canvas.Canvas(self.response, pagesize=A4)

    # ------------------ HELPERS ------------------ #

    def money(self, value):
        return f"₹ {value:,.2f}"

    def new_page(self):
        self.draw_footer()
        self.c.showPage()
        self.y = self.height - 40
        self.draw_header()

    def ensure_space(self, space=80):
        if self.y < space:
            self.new_page()

    # ------------------ HEADER / FOOTER ------------------ #

    def draw_header(self):
        self.c.setFont("Helvetica-Bold", 14)
        self.c.drawString(40, self.y, "TVUM TECH")
        self.y -= 18

        self.c.setFont("Helvetica", 10)
        self.c.drawString(40, self.y, "Lighting ERP – Bill of Quantities")
        self.y -= 25

        self.c.setFont("Helvetica", 9)
        self.c.drawString(40, self.y, f"Project: {self.boq.project.name}")
        self.c.drawRightString(self.width - 40, self.y, f"BOQ Version: {self.boq.version}")
        self.y -= 14

        self.c.drawString(40, self.y, f"Status: {self.boq.status}")
        self.c.drawRightString(self.width - 40, self.y, f"Date: {date.today().strftime('%d-%m-%Y')}")
        self.y -= 20

        self.c.line(40, self.y, self.width - 40, self.y)
        self.y -= 15

    def draw_footer(self):
        self.c.setFont("Helvetica", 8)
        self.c.drawCentredString(
            self.width / 2,
            20,
            "System generated BOQ | TVUM Lighting ERP"
        )

    # ------------------ TABLE ------------------ #

    def draw_table_header(self):
        self.c.setFont("Helvetica-Bold", 9)
        headers = [
            ("Type", 40),
            ("Item Code", 80),
            ("Description", 150),
            ("Qty", 330),
            ("Unit Price (₹)", 370),
            ("Margin (%)", 450),
            ("Line Total (₹)", 520),
        ]

        for text, x in headers:
            self.c.drawString(x, self.y, text)

        self.y -= 6
        self.c.line(40, self.y, self.width - 40, self.y)
        self.y -= 10

    # ------------------ MAIN CONTENT ------------------ #

    def build(self):
        self.draw_header()
        grand_total = Decimal(0)

        areas = (
            self.boq.items
            .select_related("area")
            .order_by("area__name")
            .values_list("area__id", "area__name")
            .distinct()
        )

        for area_id, area_name in areas:
            self.ensure_space()
            self.c.setFont("Helvetica-Bold", 10)
            self.c.drawString(40, self.y, f"Area: {area_name}")
            self.y -= 14

            self.draw_table_header()
            area_total = Decimal(0)

            items = self.boq.items.filter(area_id=area_id)

            for item in items:
                qty = Decimal(item.quantity)
                unit_price = Decimal(item.unit_price or 0)
                margin = Decimal(item.markup_pct or 0)

                line_total = qty * unit_price * (1 + margin / 100)
                area_total += line_total
                grand_total += line_total

                desc = (
                    item.product.make if item.product else
                    item.driver.driver_type if item.driver else
                    item.accessory.accessory_type
                )

                self.c.setFont("Helvetica", 9)
                self.c.drawString(40, self.y, item.item_type)
                self.c.drawString(80, self.y, item.product.order_code if item.product else "-")
                self.c.drawString(150, self.y, desc[:30])
                self.c.drawRightString(350, self.y, str(qty))
                self.c.drawRightString(430, self.y, self.money(unit_price))
                self.c.drawRightString(500, self.y, f"{margin}%")
                self.c.drawRightString(570, self.y, self.money(line_total))

                self.y -= 12
                self.ensure_space()

            # Area subtotal
            self.c.setFont("Helvetica-Bold", 9)
            self.c.drawRightString(570, self.y, self.money(area_total))
            self.y -= 20

        # Grand total
        self.c.line(350, self.y, self.width - 40, self.y)
        self.y -= 15
        self.c.setFont("Helvetica-Bold", 11)
        self.c.drawRightString(
            self.width - 40,
            self.y,
            f"Grand Total: {self.money(grand_total)}"
        )

        self.draw_footer()
        self.c.showPage()
        self.c.save()
        return self.response


@transaction.atomic
def generate_boq(project):
    # 1️⃣ Determine next version
    last_boq = BOQ.objects.filter(project=project).order_by('-version').first()
    next_version = 1 if not last_boq else last_boq.version + 1

    boq = BOQ.objects.create(
        project=project,
        version=next_version,
        status="DRAFT"
    )

    configs = LightingConfiguration.objects.filter(area__project=project)

    for config in configs:
        area = config.area
        product = config.product

        # PRODUCT
        unit_price = product.base_price
        final_price = unit_price * config.quantity

        BOQItem.objects.create(
            boq=boq,
            area=area,
            item_type="PRODUCT",
            product=product,
            quantity=config.quantity,
            unit_price=unit_price,
            final_price=final_price
        )

        # DRIVER
        config_driver = getattr(config, "configuration_driver", None)
        if config_driver:
            driver = config_driver.driver
            unit_price = driver.base_price
            final_price = unit_price * config_driver.quantity

            BOQItem.objects.create(
                boq=boq,
                area=area,
                item_type="DRIVER",
                driver=driver,
                quantity=config_driver.quantity,
                unit_price=unit_price,
                final_price=final_price
            )

        # ACCESSORIES
        accessories = ConfigurationAccessory.objects.filter(configuration=config)
        for acc in accessories:
            unit_price = acc.accessory.base_price
            qty = acc.quantity * config.quantity
            final_price = unit_price * qty

            BOQItem.objects.create(
                boq=boq,
                area=area,
                item_type="ACCESSORY",
                accessory=acc.accessory,
                quantity=qty,
                unit_price=unit_price,
                final_price=final_price
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
        .order_by('-version')
        .first()
    )

    if not boq:
        return None

    items = (
        BOQItem.objects
        .filter(boq=boq)
        .values(
            'item_type',
            'product_id',
            'driver_id',
            'accessory_id'
        )
        .annotate(total_qty=Sum('quantity'))
        # .order_by('item_type', 'item_id')
    )

    summary = {
        'PRODUCT': [],
        'DRIVER': [],
        'ACCESSORY': [],
    }

    for item in items:
        if item['item_type'] == 'PRODUCT':
            summary['PRODUCT'].append({
                'product_id': item['product_id'],
                'quantity': item['total_qty']
            })

        elif item['item_type'] == 'DRIVER':
            summary['DRIVER'].append({
                'driver_id': item['driver_id'],
                'quantity': item['total_qty']
            })

        elif item['item_type'] == 'ACCESSORY':
            summary['ACCESSORY'].append({
                'accessory_id': item['accessory_id'],
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
        boq.status = 'FINAL'
        boq.locked_at = timezone.now()
        boq.save(update_fields=['status', 'locked_at'])

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
        .order_by('-version')
        .first()
    )

    if not boq:
        return None

    items = (
        BOQItem.objects
        .filter(boq=boq)
        .values(
            'item_type',
            'product_id',
            'driver_id',
            'accessory_id'
        )
        .annotate(total_qty=Sum('quantity'))
        # .order_by('item_type', 'item_id')
    )

    summary = {
        'PRODUCT': [],
        'DRIVER': [],
        'ACCESSORY': [],
    }

    for item in items:
        if item['item_type'] == 'PRODUCT':
            summary['PRODUCT'].append({
                'product_id': item['product_id'],
                'quantity': item['total_qty']
            })

        elif item['item_type'] == 'DRIVER':
            summary['DRIVER'].append({
                'driver_id': item['driver_id'],
                'quantity': item['total_qty']
            })

        elif item['item_type'] == 'ACCESSORY':
            summary['ACCESSORY'].append({
                'accessory_id': item['accessory_id'],
                'quantity': item['total_qty']
            })

    return {
        'project_id': project.id,
        'boq_id': boq.id,
        'summary': summary
    }
    

def approve_boq(boq):
    if boq.status != "DRAFT":
        raise ValidationError("Already finalized")

    boq.status = "FINAL"
    boq.locked_at = timezone.now()
    boq.save()


def apply_margin_to_boq(boq, markup_pct):
    """
    Apply margin to all BOQ items.
    Only allowed when BOQ is in DRAFT state.
    """

    if boq.status != "DRAFT":
        raise ValidationError("Cannot modify FINAL BOQ")

    markup_pct = Decimal(markup_pct)

    for item in boq.items.all():
        item.markup_pct = markup_pct
        item.final_price = (
            item.unit_price * item.quantity * (Decimal(1) + markup_pct / Decimal(100))
        )
        item.save()

    return boq


class BOQExcelBuilder:
    def __init__(self, boq):
        self.boq = boq
        self.wb = openpyxl.Workbook()
        self.ws = self.wb.active
        self.ws.title = "BOQ"

        self.row = 1

    # ---------------- HELPERS ---------------- #

    def money(self, value):
        return float(round(Decimal(value), 2))

    def bold(self):
        return Font(bold=True)

    def center(self):
        return Alignment(horizontal="center")

    def right(self):
        return Alignment(horizontal="right")

    def write(self, col, value, bold=False, align=None, currency=False):
        cell = self.ws.cell(row=self.row, column=col, value=value)
        if bold:
            cell.font = self.bold()
        if align:
            cell.alignment = align
        if currency:
            cell.number_format = '₹#,##0.00'
        return cell

    def next_row(self, gap=1):
        self.row += gap

    # ---------------- HEADER ---------------- #

    def build_header(self):
        self.write(1, "TVUM TECH", bold=True)
        self.next_row()

        self.write(1, "Lighting ERP – Bill of Quantities", bold=True)
        self.next_row(2)

        self.write(1, "Project:", bold=True)
        self.write(2, self.boq.project.name)

        self.write(5, "BOQ Version:", bold=True)
        self.write(6, self.boq.version)

        self.next_row()

        self.write(1, "Status:", bold=True)
        self.write(2, self.boq.status)

        self.write(5, "Date:", bold=True)
        self.write(6, date.today().strftime("%d-%m-%Y"))

        self.next_row(2)

    # ---------------- TABLE HEADER ---------------- #

    def table_header(self):
        headers = [
            "Type",
            "Item Code",
            "Description",
            "Qty",
            "Unit Price (₹)",
            "Margin (%)",
            "Line Total (₹)",
        ]

        for col, header in enumerate(headers, start=1):
            self.write(col, header, bold=True, align=self.center())

        self.next_row()

    # ---------------- CONTENT ---------------- #

    def build_items(self):
        grand_total = Decimal(0)

        areas = (
            self.boq.items
            .select_related("area")
            .order_by("area__name")
            .values_list("area__id", "area__name")
            .distinct()
        )

        for area_id, area_name in areas:
            self.write(1, f"Area: {area_name}", bold=True)
            self.next_row()

            self.table_header()
            area_total = Decimal(0)

            items = self.boq.items.filter(area_id=area_id)

            for item in items:
                qty = Decimal(item.quantity)
                unit_price = Decimal(item.unit_price or 0)
                margin = Decimal(item.markup_pct or 0)

                line_total = qty * unit_price * (1 + margin / 100)

                area_total += line_total
                grand_total += line_total

                description = (
                    item.product.make if item.product else
                    item.driver.driver_type if item.driver else
                    item.accessory.accessory_type
                )

                self.write(1, item.item_type)
                self.write(2, item.product.order_code if item.product else "-")
                self.write(3, description)
                self.write(4, int(qty), align=self.center())
                self.write(5, self.money(unit_price), align=self.right(), currency=True)
                self.write(6, float(margin), align=self.center())
                self.write(7, self.money(line_total), align=self.right(), currency=True)

                self.next_row()

            # Area subtotal
            self.write(6, "Area Total", bold=True, align=self.right())
            self.write(7, self.money(area_total), bold=True, currency=True)
            self.next_row(2)

        # Grand total
        self.write(6, "Grand Total", bold=True, align=self.right())
        self.write(7, self.money(grand_total), bold=True, currency=True)

    # ---------------- FORMAT ---------------- #

    def auto_size(self):
        for col in range(1, 8):
            self.ws.column_dimensions[get_column_letter(col)].width = 20

    # ---------------- RESPONSE ---------------- #

    def build(self):
        self.build_header()
        self.build_items()
        self.auto_size()

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = (
            f'attachment; filename="BOQ_{self.boq.project.name}_V{self.boq.version}.xlsx"'
        )

        self.wb.save(response)
        return response