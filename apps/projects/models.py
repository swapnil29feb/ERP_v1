from django.db import models

# Create your models here.
class Project(models.Model):
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("COMPLETED", "Completed"),
        ("ON_HOLD", "On Hold"),
    ]

    name = models.CharField(max_length=150)
    project_code = models.CharField(max_length=50, unique=True)
    client_name = models.CharField(max_length=150)
    location = models.CharField(max_length=150, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
# apps/projects/models.py
class Area(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="areas"
    )
    name = models.CharField(max_length=100)
    area_code = models.CharField(max_length=50)
    floor = models.CharField(max_length=50, blank=True, null=True)
    area_type = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    
    class Meta:
        unique_together = ("project", "area_code")


    def __str__(self):
        return f"{self.project.name} - {self.name}"