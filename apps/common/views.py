from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from easyaudit.models import CRUDEvent
from rest_framework.pagination import PageNumberPagination
from .permissions import IsAdmin
from apps.boq.models import AuditLogEntry
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, DjangoFilterBackend]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "roles": list(user.groups.values_list("name", flat=True)),
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        })


class AuditLogPagination(PageNumberPagination):
    page_size = 100


from django.contrib.contenttypes.models import ContentType
from apps.boq.models import AuditLogEntry, BOQ, BOQItem
from apps.masters.models import Product, Driver, Accessory
from apps.projects.models import Project, Area
import json

class AuditLogView(APIView):
    """
    ERP Audit Logs - Contextual filtering by model (product, project, boq)
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, DjangoFilterBackend]

    def get(self, request):
        model_name = request.query_params.get('model')
        
        crud_queryset = CRUDEvent.objects.all()
        custom_queryset = AuditLogEntry.objects.none()

        if model_name:
            if model_name == 'product':
                cts = ContentType.objects.get_for_models(Product, Driver, Accessory).values()
                crud_queryset = crud_queryset.filter(content_type__in=cts)
            elif model_name == 'project':
                cts = ContentType.objects.get_for_models(Project, Area).values()
                crud_queryset = crud_queryset.filter(content_type__in=cts)
            elif model_name == 'boq':
                cts = ContentType.objects.get_for_models(BOQ, BOQItem).values()
                crud_queryset = crud_queryset.filter(content_type__in=cts)
                custom_queryset = AuditLogEntry.objects.all()
            else:
                crud_queryset = CRUDEvent.objects.none()

        # Limit to latest 20
        crud_logs = crud_queryset.select_related('user', 'content_type').order_by('-datetime')[:20]
        custom_logs = custom_queryset.select_related('user').order_by('-timestamp')[:20]

        combined = []
        for log in crud_logs:
            # 🎯 Standardized mapping (ERP Contract)
            combined.append({
                "action": log.get_event_type_display().upper(),
                "actor": log.user.username if log.user else "System",
                "timestamp": log.datetime.strftime("%d %b %Y, %H:%M"),
                "object": f"{log.content_type.model.title()}: {log.object_repr}",
                "_raw_time": log.datetime  # used for sorting
            })

        for log in custom_logs:
            combined.append({
                "action": log.action.upper(),
                "actor": log.user.username if log.user else "System",
                "timestamp": log.timestamp.strftime("%d %b %Y, %H:%M"),
                "object": log.details.get('item_reference', f"BOQ v{log.details.get('version', 'Unknown')}"),
                "_raw_time": log.timestamp
            })

        # Sort combined logs by raw timestamp
        combined.sort(key=lambda x: x['_raw_time'], reverse=True)
        
        # Remove raw time before sending
        final_results = []
        for c in combined[:20]:
            del c["_raw_time"]
            final_results.append(c)

        return Response({"results": final_results})
