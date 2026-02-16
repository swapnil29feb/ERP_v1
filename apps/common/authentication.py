from rest_framework_simplejwt.authentication import JWTAuthentication

class QueryParamJWTAuthentication(JWTAuthentication):
    """
    Allow JWT authentication via 'token' query parameter.
    Used for file exports (PDF/Excel) where headers cannot be set easily in window.open.
    """
    def authenticate(self, request):
        token = request.query_params.get('token')
        if not token:
            return super().authenticate(request)

        # Validate the token
        try:
            validated_token = self.get_validated_token(token)
            return self.get_user(validated_token), validated_token
        except:
            return None
