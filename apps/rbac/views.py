
from django.contrib.auth.models import User, Group, Permission
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import UserSerializer, RoleSerializer, PermissionSerializer

class UserViewSet(viewsets.ModelViewSet):
	queryset = User.objects.all()
	serializer_class = UserSerializer
	filter_backends = []  # Fix: must be iterable, not a type

	@action(detail=True, methods=['post'], url_path='assign-role')
	def assign_role(self, request, pk=None):
		user = self.get_object()
		group_id = request.data.get('group_id')
		try:
			group = Group.objects.get(id=group_id)
		except Group.DoesNotExist:
			return Response({'detail': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)
		user.groups.add(group)
		return Response({'detail': 'Role assigned.'}, status=status.HTTP_200_OK)

class RoleViewSet(viewsets.ModelViewSet):
	queryset = Group.objects.all()
	serializer_class = RoleSerializer

	@action(detail=True, methods=['post'], url_path='assign-permissions')
	def assign_permissions(self, request, pk=None):
		group = self.get_object()
		permission_ids = request.data.get('permission_ids', [])
		permissions = Permission.objects.filter(id__in=permission_ids)
		group.permissions.set(permissions)
		return Response({'detail': 'Permissions assigned.'}, status=status.HTTP_200_OK)

	@action(detail=True, methods=['get', 'post'], url_path='permissions')
	def permissions(self, request, pk=None):
		group = self.get_object()
		if request.method == 'GET':
			perms = group.permissions.all()
			# Format: app_label:codename
			perm_strings = [f"{p.content_type.app_label}:{p.codename}" for p in perms]
			return Response(perm_strings)
		elif request.method == 'POST':
			perm_strings = request.data.get('permissions', [])
			perms = []
			for perm_str in perm_strings:
				try:
					app_label, codename = perm_str.split(':', 1)
					perm = Permission.objects.get(content_type__app_label=app_label, codename=codename)
					perms.append(perm)
				except (ValueError, Permission.DoesNotExist):
					return Response({'detail': f'Permission not found: {perm_str}'}, status=status.HTTP_400_BAD_REQUEST)
			group.permissions.set(perms)
			return Response({'detail': 'Permissions updated.'}, status=status.HTTP_200_OK)

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = Permission.objects.all()
	serializer_class = PermissionSerializer
