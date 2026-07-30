from rest_framework import permissions
from apps.workspaces.models import WorkspaceMember

class IsWorkspaceMemberForCollection(permissions.BasePermission):
    """
    Checks if the user is a member/owner of the workspace a collection belongs to.
    SAFE_METHODS (GET, HEAD, OPTIONS) are allowed for all members.
    Unsafe methods (POST, PUT, PATCH, DELETE) require owner, admin, or editor roles.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        workspace = obj.workspace
        is_owner = workspace.owner == request.user

        
        membership = workspace.memberships.filter(user=request.user).first()
        is_member = membership is not None

        if not (is_owner or is_member):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        
        return is_owner or membership.role in ('admin', 'editor')


class IsWorkspaceMemberForRequest(permissions.BasePermission):
    """
    Checks if the user is a member/owner of the workspace a request's collection belongs to.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        workspace = obj.collection.workspace
        is_owner = workspace.owner == request.user

        
        membership = workspace.memberships.filter(user=request.user).first()
        is_member = membership is not None

        if not (is_owner or is_member):
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        
        return is_owner or membership.role in ('admin', 'editor')
