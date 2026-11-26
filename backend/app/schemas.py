from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    HttpUrl,
    field_validator,
    model_validator,
)

from app.db.models import AccountStatus, LotStatus, TransportStatus, UserRole


class RegistroRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    address: str | None = Field(default=None, min_length=1, max_length=500)

    @field_validator("role")
    @classmethod
    def prevent_public_admin_registration(cls, value: UserRole) -> UserRole:
        if value is UserRole.ADMIN:
            raise ValueError("El rol ADMIN no puede registrarse públicamente.")
        return value

    @field_validator("address")
    @classmethod
    def strip_address(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("La dirección no puede estar vacía.")
        return normalized


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UsuarioRead(BaseModel):
    id: UUID
    email: str
    role: UserRole
    account_status: AccountStatus
    rejection_reason: str | None
    address: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RechazoRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El motivo de rechazo no puede estar vacío.")
        return normalized


class LoteCreate(BaseModel):
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=500)
    weight_kg: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    expires_at: datetime
    requires_cold_chain: bool = False
    pickup_address: str = Field(min_length=1, max_length=500)
    image_url: HttpUrl | None = None

    @field_validator("expires_at")
    @classmethod
    def validate_expiration(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("La fecha de vencimiento debe incluir zona horaria.")
        if value <= datetime.now(timezone.utc):
            raise ValueError("La fecha de vencimiento debe ser futura.")
        return value

    @field_validator("category", "description", "pickup_address")
    @classmethod
    def strip_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El campo no puede estar vacío.")
        return normalized


class LoteRead(BaseModel):
    id: UUID
    donor_id: UUID
    category: str
    description: str
    weight_kg: Decimal
    expires_at: datetime
    requires_cold_chain: bool
    pickup_address: str
    image_url: str | None
    status: LotStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReservaCreate(BaseModel):
    request_transport: bool = False
    delivery_address: str | None = Field(default=None, min_length=1, max_length=500)

    @field_validator("delivery_address")
    @classmethod
    def strip_delivery_address(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("La dirección de entrega no puede estar vacía.")
        return normalized

    @model_validator(mode="after")
    def validate_transport_address(self) -> ReservaCreate:
        if self.request_transport and self.delivery_address is None:
            raise ValueError(
                "La dirección de entrega es obligatoria al solicitar transporte."
            )
        return self


class ReservaRead(BaseModel):
    id: UUID
    lot_id: UUID
    comedor_id: UUID
    created_at: datetime
    transport_request_id: UUID | None


class SolicitudTransporteRead(BaseModel):
    id: UUID
    reservation_id: UUID
    lot_id: UUID
    category: str
    description: str
    weight_kg: Decimal
    requires_cold_chain: bool
    pickup_address: str
    delivery_address: str
    status: TransportStatus
    driver_id: UUID | None
    created_at: datetime
    assigned_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
