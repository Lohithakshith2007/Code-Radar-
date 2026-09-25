from django.db import models
from django.conf import settings


class AnalysisRecord(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="analysis_records",
        null=True,
        blank=True,
    )
    code_snippet = models.TextField()
    language = models.CharField(max_length=50, default="python")
    metrics = models.JSONField(default=dict)
    ai_suggestion = models.TextField(blank=True, default="")
    score = models.CharField(max_length=20, default="Low")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Analysis #{self.pk} - {self.score} ({self.created_at:%Y-%m-%d %H:%M})"
