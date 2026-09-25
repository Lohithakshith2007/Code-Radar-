from django.urls import path

from . import auth_views

urlpatterns = [
    path('register/', auth_views.register, name='register'),
    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),
    path('me/', auth_views.current_user, name='current_user'),
    path('profile/', auth_views.update_profile, name='update_profile'),
    path('password/', auth_views.change_password, name='change_password'),
]
