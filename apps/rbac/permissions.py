def has_permission(user, module, action):
    """
    Check if the user has a specific permission in the format <module>_<action>.
    Example: has_permission(user, 'projects', 'view')
    """
    codename = f"{module}_{action}"
    return user.has_perm(f"rbac.{codename}")
