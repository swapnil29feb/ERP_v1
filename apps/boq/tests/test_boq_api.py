import pytest
from rest_framework.test import APIClient
from apps.projects.models import Project


@pytest.mark.django_db
def test_generate_boq_api():
    project = Project.objects.create(
        name="BOQ Project",
        project_code="BOQ-001",
        client_name="BOQ Client"
    )

    client = APIClient()
    response = client.post(f"/api/boq/generate/{project.id}/")

    assert response.status_code == 200
    assert 'id' in response.data
    assert response.data["status"] == "DRAFT"
    assert response.data["version"] == 1
    