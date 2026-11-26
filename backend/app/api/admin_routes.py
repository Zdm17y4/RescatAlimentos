from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.dependencies import AuthenticatedActor, require_role
from app.db.models import UserRole
from app.schemas import RechazoRequest, UsuarioRead
from app.services import AdminUserService
from app.unit_of_work import UnitOfWork, get_unit_of_work

router = APIRouter(
    prefix="/api/v1/admin/usuarios",
    tags=["Administración de usuarios"],
)
UowDependency = Annotated[UnitOfWork, Depends(get_unit_of_work)]
AdminDependency = Annotated[
    AuthenticatedActor, Depends(require_role(UserRole.ADMIN))
]


@router.get(
    "/pendientes",
    response_model=list[UsuarioRead],
    responses={
        401: {"description": "Se requiere un access token válido."},
        403: {"description": "El usuario debe tener rol ADMIN."},
    },
)
def list_pending_users(
    uow: UowDependency, _: AdminDependency
) -> list[UsuarioRead]:
    return AdminUserService(uow).list_pending()


@router.post(
    "/{user_id}/aprobar",
    response_model=UsuarioRead,
    responses={
        401: {"description": "Se requiere un access token válido."},
        403: {"description": "El usuario debe tener rol ADMIN."},
        404: {"description": "No se encontró la cuenta."},
        409: {"description": "La cuenta ya fue procesada."},
    },
)
def approve_user(
    user_id: UUID, uow: UowDependency, _: AdminDependency
) -> UsuarioRead:
    return AdminUserService(uow).approve(user_id)


@router.post(
    "/{user_id}/rechazar",
    response_model=UsuarioRead,
    responses={
        401: {"description": "Se requiere un access token válido."},
        403: {"description": "El usuario debe tener rol ADMIN."},
        404: {"description": "No se encontró la cuenta."},
        409: {"description": "La cuenta ya fue procesada."},
    },
)
def reject_user(
    user_id: UUID,
    data: RechazoRequest,
    uow: UowDependency,
    _: AdminDependency,
) -> UsuarioRead:
    return AdminUserService(uow).reject(user_id, data.reason)
