from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from apps.projects.models import Project
from apps.boq.models import BOQ
from apps.boq.services.boq_service import (
    get_project_boq_summary,
    generate_boq,
    approve_boq,
    apply_margin_to_boq
)
from apps.boq.services.boq_service import BOQPDFBuilder
from apps.boq.services.boq_service import BOQExcelBuilder
from apps.boq.serializers import BOQSerializer
# from django.http import HttpResponse
# from reportlab.pdfgen import canvas
# import openpyxl
# from openpyxl.workbook import Workbook
from django.core.exceptions import ValidationError


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


class BOQExportPDFAPI(APIView):
    def get(self, request, boq_id):
        boq = get_object_or_404(BOQ, id=boq_id)
        pdf = BOQPDFBuilder(boq)
        return pdf.build()
        

class BOQExportExcelAPI(APIView):
    def get(self, request, boq_id):
        boq = get_object_or_404(BOQ, id=boq_id)
        return BOQExcelBuilder(boq).build()


class ApplyBOQMarginAPI(APIView):
    """
    Apply margin (percentage) to a DRAFT BOQ
    """

    def post(self, request, boq_id):
        boq = get_object_or_404(BOQ, id=boq_id)

        markup_pct = request.data.get("markup_pct")

        if markup_pct is None:
            return Response(
                {"detail": "markup_pct is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            apply_margin_to_boq(boq, markup_pct)
        except ValidationError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {
                "detail": f"Margin {markup_pct}% applied successfully",
                "boq_id": boq.id
            },
            status=status.HTTP_200_OK
        )