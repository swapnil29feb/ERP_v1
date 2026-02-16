from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

MODULES = [
    'projects',
    'configurations',
    'boq',
    'procurement',
    'inventory',
    'dispatch',
    'invoicing',
    'settings',
]

ACTIONS = [
    'view',
    'create',
    'edit',
    'approve',
    'delete',
    'export',
]

class Command(BaseCommand):
    help = 'Seed ERP module permissions.'

    def handle(self, *args, **options):
        # Use content_type of any existing model (User)
        content_type = ContentType.objects.get(app_label='auth', model='user')
        created = 0
        for module in MODULES:
            for action in ACTIONS:
                codename = f"{module}_{action}"
                name = f"Can {action} {module}"
                if not Permission.objects.filter(codename=codename, content_type=content_type).exists():
                    Permission.objects.create(
                        codename=codename,
                        name=name,
                        content_type=content_type
                    )
                    created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} permissions."))
