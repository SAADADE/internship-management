from rest_framework.authentication import BaseAuthentication


class SessionAuthentication(BaseAuthentication):
    """Allow authenticated Django sessions to be used by DRF without forcing CSRF checks for SPA requests."""

    def authenticate(self, request):
        user = getattr(request._request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return None
        return user, None
