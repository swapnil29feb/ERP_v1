from django.test import TestCase
from apps.projects.models import Project, Area
from apps.masters.models import Product
from apps.configurations.models import LightingConfiguration
from apps.boq.services.boq_service import generate_boq
from apps.boq.models import BOQItem


class TestGenerateBOQ(TestCase):

    def setUp(self):
        self.project = Project.objects.create(name="Test Project")
        self.area = Area.objects.create(
            project=self.project,
            name="Lobby"
        )

        self.product = Product.objects.create(
            make="Test",
            order_code="P-001",
            driver_integration="INTEGRATED",
            weight_kg=1.50,
            warranty_years=3
        )

        LightingConfiguration.objects.create(
            area=self.area,
            product=self.product,
            driver=None,
            quantity=5
        )

    def test_product_boq_created(self):
        boq = generate_boq(self.project)

        items = BOQItem.objects.filter(
            boq=boq,
            item_type="PRODUCT"
        )

        self.assertEqual(items.count(), 1)
        self.assertEqual(items.first().quantity, 5)
