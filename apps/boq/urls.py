from django.urls import path
from .views import (
    GenerateBOQAPI,
    BOQSummaryAPI,
    BOQApproveAPI,
    BOQExportPDFAPI,
    BOQExportExcelAPI,
    ApplyBOQMarginAPI
)

urlpatterns = [
    path('generate/<int:project_id>/', GenerateBOQAPI.as_view()),
    path('summary/<int:project_id>/', BOQSummaryAPI.as_view()),
    path('approve/<int:boq_id>/', BOQApproveAPI.as_view()),
    
    # Download PDF/EXCEL
    path("export/pdf/<int:boq_id>/", BOQExportPDFAPI.as_view()),
    path("export/excel/<int:boq_id>/", BOQExportExcelAPI.as_view()),
    path("apply-margin/<int:boq_id>/", ApplyBOQMarginAPI.as_view()),
]
