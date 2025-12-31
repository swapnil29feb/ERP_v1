from rest_framework.test import APIClient
from apps.configurations.models import LightingConfiguration
from apps.projects.models import Project, Area
from apps.masters.models import Product
import pytest


@pytest.mark.django_db
def test_create_configuration_api():
    project = Project.objects.create(
        name="Config Project",
        project_code="CFG-001",
        client_name="Config Client"
    )

    area = Area.objects.create(
        project=project,
        name="Living Room",
        area_type="Residential"
    )

    product = Product.objects.create(
        make="Test",
        order_code="LGT-001",
        wattage=10,
        lumen_output=1000
    )

    LightingConfiguration.objects.create(
        area=area,
        product=product,
        quantity=5
    )

    client = APIClient()
    response = client.get(f"/api/configurations/by-area/{area.id}/")

    assert response.status_code == 200
    assert len(response.data) == 1
