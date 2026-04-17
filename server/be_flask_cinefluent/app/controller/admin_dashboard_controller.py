from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from .auth_controller import Role_required
from ..services.admin_dashboard_service import get_admin_dashboard_overview
from ..utils.response import success_response

admin_dashboard_bp = Blueprint("api/admin-dashboard", __name__)


@admin_dashboard_bp.route("/overview", methods=["GET"])
@Role_required(role="admin")
@jwt_required()
def get_dashboard_overview():
    days = request.args.get("days", default=7, type=int)
    top = request.args.get("top", default=5, type=int)
    payload = get_admin_dashboard_overview(days=days, top=top)
    return success_response(data=payload, message="Get admin dashboard overview successfully", code=200)
