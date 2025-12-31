from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from apps.projects.models import Project
from apps.boq.services.boq_service import (
    get_project_boq_summary,
    generate_boq,
    approve_boq,
)
from apps.boq.serializers import BOQSerializer


class GenerateBOQAPI(APIView):
    def post(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        boq = generate_boq(project)
        return Response(BOQSerializer(boq).data)


class BOQSummaryAPI(APIView):
    """
    Project-wise BOQ summary (latest BOQ)
    """
    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        summary = get_project_boq_summary(project)
        return Response(summary)

  
class BOQApproveAPI(APIView):
    def post(self, request, boq_id):
        boq = get_object_or_404(BOQ, id=boq_id)
        approve_boq(boq)
        return Response(
            {"detail": f"BOQ v{boq.version} approved"},
            status=status.HTTP_200_OK
        )
