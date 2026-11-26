from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings
from app.db.models import UserRole

password_hash = PasswordHash.recommended()


@dataclass(frozen=True)
class AccessTokenClaims:
    subject: UUID
    role: UserRole


class InvalidAccessTokenError(Exception):
    pass


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(subject: UUID, role: UserRole) -> str:
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )
    return jwt.encode(
        {"sub": str(subject), "role": role.value, "exp": expires_at},
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> AccessTokenClaims:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "role", "exp"]},
        )
        return AccessTokenClaims(
            subject=UUID(payload["sub"]),
            role=UserRole(payload["role"]),
        )
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as error:
        raise InvalidAccessTokenError("El token de acceso no es válido.") from error
