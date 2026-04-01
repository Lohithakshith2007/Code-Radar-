from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.analyze_code, name='analyze'),
    path('suggest/', views.ai_suggest, name='suggest'),
    path('chat/', views.chat, name='chat'),
    path('history/', views.analysis_history, name='history'),
    path('history/clear/', views.clear_history, name='clear_history'),
]