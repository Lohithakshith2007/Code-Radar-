from django.contrib.auth import authenticate, get_user_model, password_validation
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.utils.text import slugify
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


User = get_user_model()


def _user_data(user):
    return {
        "id": user.pk,
        "username": user.first_name or user.username,
        "email": user.email,
        "date_joined": user.date_joined.isoformat(),
        "analysis_count": user.analysis_records.count(),
    }


def _auth_response(user, http_status=status.HTTP_200_OK):
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    return Response({"token": token.key, "user": _user_data(user)}, status=http_status)


def _validation_message(errors):
    return " ".join(errors)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    name = str(request.data.get("name", "")).strip()
    email = str(request.data.get("email", "")).strip().lower()
    password = request.data.get("password", "")

    if not name or not email or not password:
        return Response({"error": "Name, email, and password are required."}, status=status.HTTP_400_BAD_REQUEST)
    if len(name) > 150:
        return Response({"error": "Name must be 150 characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        validate_email(email)
    except ValidationError:
        return Response({"error": "Enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email__iexact=email).exists():
        return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    username_base = slugify(email.split("@", 1)[0])[:140] or "user"
    username = username_base
    suffix = 1
    while User.objects.filter(username=username).exists():
        username = f"{username_base[:140]}{suffix}"
        suffix += 1

    candidate = User(username=username, email=email, first_name=name)
    try:
        password_validation.validate_password(password, user=candidate)
    except ValidationError as exc:
        return Response({"error": _validation_message(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password, first_name=name)
    return _auth_response(user, status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = str(request.data.get("email", "")).strip().lower()
    password = request.data.get("password", "")
    if not email or not password:
        return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    user_record = User.objects.filter(email__iexact=email).first()
    user = authenticate(request, username=user_record.username, password=password) if user_record else None
    if user is None:
        return Response({"error": "Email or password is incorrect."}, status=status.HTTP_401_UNAUTHORIZED)
    return _auth_response(user)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    if request.auth:
        request.auth.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response(_user_data(request.user))


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    name = str(request.data.get("name", "")).strip()
    email = str(request.data.get("email", "")).strip().lower()
    if not name or not email:
        return Response({"error": "Name and email are required."}, status=status.HTTP_400_BAD_REQUEST)
    if len(name) > 150:
        return Response({"error": "Name must be 150 characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)
    try:
        validate_email(email)
    except ValidationError:
        return Response({"error": "Enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email__iexact=email).exclude(pk=request.user.pk).exists():
        return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    request.user.first_name = name
    request.user.email = email
    request.user.save(update_fields=["first_name", "email"])
    return Response(_user_data(request.user))


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    current = request.data.get("current_password", "")
    new = request.data.get("new_password", "")
    if not current or not new:
        return Response({"error": "Current and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)
    if not request.user.check_password(current):
        return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        password_validation.validate_password(new, user=request.user)
    except ValidationError as exc:
        return Response({"error": _validation_message(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(new)
    request.user.save(update_fields=["password"])
    response = _auth_response(request.user)
    response.data["message"] = "Password updated successfully."
    return response
