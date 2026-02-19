from rest_framework.permissions import BasePermission

class HasPermission(BasePermission):
    """
    Generic permission checker.
    Usage:
        permission_required = "boq.approve_boq"
    """

    permission_required = None

    def has_permission(self, request, view):
        perm = getattr(view, "permission_required", None)
        if not perm:
            return True
        return request.user.has_perm(perm)