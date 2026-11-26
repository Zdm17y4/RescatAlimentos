from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SqlEnum,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserRole(str, Enum):
    DONANTE = "DONANTE"
    COMEDOR = "COMEDOR"
    DRIVER = "DRIVER"
    ADMIN = "ADMIN"


class AccountStatus(str, Enum):
    PENDIENTE = "PENDIENTE"
    ACTIVO = "ACTIVO"
    RECHAZADO = "RECHAZADO"


class LotStatus(str, Enum):
    DISPONIBLE = "DISPONIBLE"
    RESERVADO = "RESERVADO"


class TransportStatus(str, Enum):
    DISPONIBLE = "DISPONIBLE"
    ASIGNADA = "ASIGNADA"


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(
        SqlEnum(UserRole, name="user_role", native_enum=False, length=20)
    )
    account_status: Mapped[AccountStatus] = mapped_column(
        SqlEnum(AccountStatus, name="account_status", native_enum=False, length=20),
        default=AccountStatus.PENDIENTE,
    )
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Lot(Base):
    __tablename__ = "lots"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    donor_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), index=True
    )
    category: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(500))
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    requires_cold_chain: Mapped[bool] = mapped_column(Boolean, default=False)
    pickup_address: Mapped[str] = mapped_column(String(500))
    image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    status: Mapped[LotStatus] = mapped_column(
        SqlEnum(LotStatus, name="lot_status", native_enum=False, length=20),
        default=LotStatus.DISPONIBLE,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (
        UniqueConstraint("lot_id", name="uq_reservations_lot_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    lot_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("lots.id"))
    comedor_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class TransportRequest(Base):
    __tablename__ = "transport_requests"
    __table_args__ = (
        UniqueConstraint("reservation_id", name="uq_transport_reservation_id"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    reservation_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("reservations.id")
    )
    lot_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("lots.id"))
    pickup_address: Mapped[str] = mapped_column(String(500))
    delivery_address: Mapped[str] = mapped_column(String(500))
    status: Mapped[TransportStatus] = mapped_column(
        SqlEnum(
            TransportStatus,
            name="transport_status",
            native_enum=False,
            length=20,
        ),
        default=TransportStatus.DISPONIBLE,
        index=True,
    )
    driver_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
