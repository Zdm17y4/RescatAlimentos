from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import InvalidAccessTokenError, decode_access_token
from app.db.models import UserRole


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedActor:
    user_id: UUID
    role: UserRole


def get_current_actor(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthenticatedActor:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Se requiere autenticación.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        claims = decode_access_token(credentials.credentials)
    except InvalidAccessTokenError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    return AuthenticatedActor(user_id=claims.subject, role=claims.role)


def require_role(required_role: UserRole):
    def dependency(
        actor: AuthenticatedActor = Depends(get_current_actor),
    ) -> AuthenticatedActor:
        if actor.role is not required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El rol no tiene permiso para esta operación.",
            )
        return actor

    return dependency
