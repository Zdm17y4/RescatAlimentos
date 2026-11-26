from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.schemas import LoginRequest, RegistroRequest, TokenRead, UsuarioRead
from app.services import AuthService
from app.unit_of_work import UnitOfWork, get_unit_of_work

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])
UowDependency = Annotated[UnitOfWork, Depends(get_unit_of_work)]


@router.post(
    "/registro",
    response_model=UsuarioRead,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"description": "El correo ya está registrado."}},
)
def register(data: RegistroRequest, uow: UowDependency) -> UsuarioRead:
    return AuthService(uow).register(data)


@router.post(
    "/login",
    response_model=TokenRead,
    responses={
        401: {"description": "Credenciales incorrectas."},
        403: {"description": "La cuenta no está activa."},
    },
)
def login(data: LoginRequest, uow: UowDependency) -> TokenRead:
    return AuthService(uow).login(data)
