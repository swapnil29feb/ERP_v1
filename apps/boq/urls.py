from django.urls import path
from .views import GenerateBOQAPI, BOQSummaryAPI, BOQApproveAPI

urlpatterns = [
    path('generate/<int:project_id>/', GenerateBOQAPI.as_view()),
    path('summary/<int:project_id>/', BOQSummaryAPI.as_view()),
    path('approve/<int:boq_id>/', BOQApproveAPI.as_view()),
]
