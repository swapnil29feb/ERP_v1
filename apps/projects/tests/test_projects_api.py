

import pytest
from rest_framework.test import APIClient
from apps.projects.models import Project

@pytest.mark.django_db
def test_create_api():
    client = APIClient()
    project_data = {
        "name": "Test Project",
        "project_code": "PRJ-001",
        "client_name": "Test Client"
    }
    response = client.post('/api/projects/', project_data, format='json')
    
    assert response.status_code == 201
    assert Project.objects.count() == 1
    assert Project.objects.first().name == "Test Project"


@pytest.mark.django_db
def test_get_project_detail():
    project = Project.objects.create(
        name="demo",
        project_code="PRJ-002",
        client_name="Demo Client"
    )
    
    client = APIClient()
    
    response = client.get(f"/api/projects/{project.id}/")
    
    assert response.status_code == 200
    assert response.data['name'] == "demo"
    # assert response.data['project_code'] == "PRJ-002"