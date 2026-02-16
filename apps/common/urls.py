from django.urls import path
from .views import MeView, AuditLogView


# print("🔥 USING apps/common/urls.py")   
urlpatterns = [
    path("me/", MeView.as_view(), name="auth-me"),
    path("audit/logs/", AuditLogView.as_view(), name="audit-logs"),
]

