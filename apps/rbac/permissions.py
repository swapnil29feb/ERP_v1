def has_permission(user, perm):
    """
    Example:
    has_permission(user, "boq.approve_boq")
    """
    return user.has_perm(perm)