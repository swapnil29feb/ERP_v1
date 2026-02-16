from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission

ROLE_PERMISSIONS = {
    'Super Admin': 'ALL',
    'Admin': [],  # No permissions assigned by default
    'Sales Engineer': [
        'projects_view', 'projects_create', 'projects_edit',
        'boq_view', 'boq_create',
    ],
    'Design Engineer': [],  # No permissions assigned by default
    'Manager': [
        'boq_approve', 'projects_view',
    ],
    'Purchase': [],  # No permissions assigned by default
    'Accounts': [
        'invoicing_view', 'invoicing_create',
    ],
    'Store': [
        'inventory_view', 'inventory_edit',
        'dispatch_view', 'dispatch_create',
    ],
}

class Command(BaseCommand):
    help = 'Seed ERP roles and assign permissions.'

    def handle(self, *args, **options):
        created = 0
        for role, perms in ROLE_PERMISSIONS.items():
            group, group_created = Group.objects.get_or_create(name=role)
            if group_created:
                created += 1
            if perms == 'ALL':
                group.permissions.set(Permission.objects.all())
            elif perms:
                perm_objs = Permission.objects.filter(codename__in=perms)
                group.permissions.set(perm_objs)
            else:
                group.permissions.clear()
        self.stdout.write(self.style.SUCCESS(f'Seeded {created} roles and assigned permissions.'))
