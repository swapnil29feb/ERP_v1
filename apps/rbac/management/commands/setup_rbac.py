from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission

class Command(BaseCommand):
    help = "Setup default ERP roles and permissions"

    def handle(self, *args, **kwargs):
        roles = {
            "Admin": [],

            "Editor": [
                "projects.view_project",
                "projects.add_project",
                "projects.change_project",

                "configurations.view_lightingconfiguration",
                "configurations.add_lightingconfiguration",
                "configurations.change_lightingconfiguration",

                "boq.generate_boq",
                "boq.view_boq",
                "boq.apply_margin",
            ],

            "Finance": [
                "boq.view_boq",
                "boq.apply_margin",
                "boq.approve_boq",
                "boq.export_boq",
            ],

            "Viewer": [
                "projects.view_project",
                "boq.view_boq",
            ],
        }


        for role_name, perm_list in roles.items():
            group, _ = Group.objects.get_or_create(name=role_name)
            perms = []

            for perm_str in perm_list:
                app, codename = perm_str.split(".")
                perm = Permission.objects.get(
                    content_type__app_label=app,
                    codename=codename
                )
                perms.append(perm)

            if perm_list:
                group.permissions.set(perms)

        self.stdout.write(self.style.SUCCESS("RBAC setup complete"))