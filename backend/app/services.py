from uuid import UUID

from app.db.models import (
    AccountStatus,
    Lot,
    LotStatus,
    Reservation,
    TransportRequest,
    TransportStatus,
    User,
)
from app.domain.errors import (
    InvalidTransitionError,
    InactiveAccountError,
    InvalidCredentialsError,
    PersistenceConflictError,
    ResourceConflictError,
    ResourceNotFoundError,
)
from app.domain.states import AccountLifecycle, LotLifecycle, TransportLifecycle
from app.core.security import create_access_token, hash_password, verify_password
from app.schemas import (
    LoginRequest,
    LoteCreate,
    LoteRead,
    RegistroRequest,
    TokenRead,
    UsuarioRead,
    ReservaCreate,
    ReservaRead,
    SolicitudTransporteRead,
)
from app.unit_of_work import UnitOfWork


class AuthService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    def register(self, data: RegistroRequest) -> UsuarioRead:
        email = str(data.email).strip().lower()
        try:
            with self._uow:
                if self._uow.users.get_by_email(email) is not None:
                    raise ResourceConflictError(
                        "Ya existe una cuenta registrada con ese correo."
                    )
                user = User(
                    email=email,
                    password_hash=hash_password(data.password),
                    role=data.role,
                    account_status=AccountStatus.PENDIENTE,
                    address=data.address,
                )
                self._uow.users.add(user)
                self._uow.flush()
                return UsuarioRead.model_validate(user)
        except PersistenceConflictError as error:
            raise ResourceConflictError(
                "Ya existe una cuenta registrada con ese correo."
            ) from error

    def login(self, data: LoginRequest) -> TokenRead:
        email = str(data.email).strip().lower()
        with self._uow:
            user = self._uow.users.get_by_email(email)
            if user is None or not verify_password(data.password, user.password_hash):
                raise InvalidCredentialsError("Correo o contraseña incorrectos.")
            if user.account_status is not AccountStatus.ACTIVO:
                raise InactiveAccountError(
                    "La cuenta no está activa y no puede iniciar sesión."
                )
            token = create_access_token(user.id, user.role)
            return TokenRead(access_token=token)


class AdminUserService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    def list_pending(self) -> list[UsuarioRead]:
        with self._uow:
            return [
                UsuarioRead.model_validate(user)
                for user in self._uow.users.list_by_status(AccountStatus.PENDIENTE)
            ]

    def approve(self, user_id: UUID) -> UsuarioRead:
        return self._transition(user_id, approve=True)

    def reject(self, user_id: UUID, reason: str) -> UsuarioRead:
        return self._transition(user_id, approve=False, reason=reason)

    def _transition(
        self, user_id: UUID, *, approve: bool, reason: str | None = None
    ) -> UsuarioRead:
        try:
            with self._uow:
                user = self._uow.users.get(user_id, for_update=True)
                if user is None:
                    raise ResourceNotFoundError("No se encontró la cuenta.")
                lifecycle = AccountLifecycle.from_values(
                    user.account_status, user.rejection_reason
                )
                if approve:
                    lifecycle.approve()
                else:
                    if reason is None:
                        raise ValueError("El motivo de rechazo es obligatorio.")
                    lifecycle.reject(reason)
                user.account_status = lifecycle.status
                user.rejection_reason = lifecycle.rejection_reason
                self._uow.flush()
                return UsuarioRead.model_validate(user)
        except InvalidTransitionError as error:
            raise ResourceConflictError(str(error)) from error


class LoteService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    def crear(self, data: LoteCreate, donor_id: UUID) -> LoteRead:
        try:
            with self._uow:
                lot = Lot(
                    donor_id=donor_id,
                    category=data.category,
                    description=data.description,
                    weight_kg=data.weight_kg,
                    expires_at=data.expires_at,
                    requires_cold_chain=data.requires_cold_chain,
                    pickup_address=data.pickup_address,
                    image_url=str(data.image_url) if data.image_url else None,
                    status=LotStatus.DISPONIBLE,
                )
                self._uow.lotes.add(lot)
                self._uow.flush()
                return LoteRead.model_validate(lot)
        except PersistenceConflictError as error:
            raise ResourceConflictError(
                "No se pudo guardar el lote por un conflicto de datos."
            ) from error

    def listar(
        self, status: LotStatus | None = LotStatus.DISPONIBLE
    ) -> list[LoteRead]:
        with self._uow:
            return [
                LoteRead.model_validate(lot)
                for lot in self._uow.lotes.list(status)
            ]

    def obtener(self, lot_id: UUID) -> LoteRead:
        with self._uow:
            lot = self._uow.lotes.get(lot_id)
            if lot is None:
                raise ResourceNotFoundError("No se encontró el lote.")
            return LoteRead.model_validate(lot)

    def reservar(
        self, lot_id: UUID, comedor_id: UUID, data: ReservaCreate
    ) -> ReservaRead:
        try:
            with self._uow:
                lot = self._uow.lotes.get(lot_id, for_update=True)
                if lot is None:
                    raise ResourceNotFoundError("No se encontró el lote.")

                lifecycle = LotLifecycle.from_status(lot.status)
                lifecycle.reserve()
                lot.status = lifecycle.status

                reservation = Reservation(lot_id=lot.id, comedor_id=comedor_id)
                self._uow.reservas.add(reservation)
                self._uow.flush()

                transport_request_id = None
                if data.request_transport:
                    transport_request = TransportRequest(
                        reservation_id=reservation.id,
                        lot_id=lot.id,
                        pickup_address=lot.pickup_address,
                        delivery_address=data.delivery_address,
                        status=TransportStatus.DISPONIBLE,
                    )
                    self._uow.transporte.add(transport_request)
                    self._uow.flush()
                    transport_request_id = transport_request.id

                return ReservaRead(
                    id=reservation.id,
                    lot_id=reservation.lot_id,
                    comedor_id=reservation.comedor_id,
                    created_at=reservation.created_at,
                    transport_request_id=transport_request_id,
                )
        except InvalidTransitionError as error:
            raise ResourceConflictError(str(error)) from error
        except PersistenceConflictError as error:
            raise ResourceConflictError(
                "El lote ya fue reservado o existe un conflicto de persistencia."
            ) from error


class TransporteService:
    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    def listar(self, available_only: bool) -> list[SolicitudTransporteRead]:
        status = TransportStatus.DISPONIBLE if available_only else None
        with self._uow:
            rows = self._uow.transporte.list(status)
            return [
                self._to_read(request, lot)
                for request, lot in rows
            ]

    def aceptar(
        self, request_id: UUID, driver_id: UUID
    ) -> SolicitudTransporteRead:
        try:
            with self._uow:
                request = self._uow.transporte.get(request_id, for_update=True)
                if request is None:
                    raise ResourceNotFoundError(
                        "No se encontró la solicitud de transporte."
                    )
                lot = self._uow.lotes.get(request.lot_id)
                if lot is None:
                    raise ResourceNotFoundError(
                        "No se encontró el lote de la solicitud."
                    )

                lifecycle = TransportLifecycle.from_values(
                    request.status,
                    request.driver_id,
                    request.assigned_at,
                )
                lifecycle.assign(driver_id)
                request.status = lifecycle.status
                request.driver_id = lifecycle.driver_id
                request.assigned_at = lifecycle.assigned_at
                self._uow.flush()
                return self._to_read(request, lot)
        except InvalidTransitionError as error:
            raise ResourceConflictError(str(error)) from error
        except PersistenceConflictError as error:
            raise ResourceConflictError(
                "La solicitud ya fue asignada o existe un conflicto de persistencia."
            ) from error

    @staticmethod
    def _to_read(
        request: TransportRequest, lot: Lot
    ) -> SolicitudTransporteRead:
        return SolicitudTransporteRead(
            id=request.id,
            reservation_id=request.reservation_id,
            lot_id=request.lot_id,
            category=lot.category,
            description=lot.description,
            weight_kg=lot.weight_kg,
            requires_cold_chain=lot.requires_cold_chain,
            pickup_address=request.pickup_address,
            delivery_address=request.delivery_address,
            status=request.status,
            driver_id=request.driver_id,
            created_at=request.created_at,
            assigned_at=request.assigned_at,
        )
