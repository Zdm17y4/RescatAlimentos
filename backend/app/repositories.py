from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    AccountStatus,
    Lot,
    LotStatus,
    Reservation,
    TransportRequest,
    TransportStatus,
    User,
)


class UserRepository(Protocol):
    def add(self, user: User) -> None: ...

    def get(self, user_id: UUID, *, for_update: bool = False) -> User | None: ...

    def get_by_email(self, email: str) -> User | None: ...

    def list_by_status(self, status: AccountStatus) -> list[User]: ...


class SqlAlchemyUserRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, user: User) -> None:
        self._session.add(user)

    def get(self, user_id: UUID, *, for_update: bool = False) -> User | None:
        statement = select(User).where(User.id == user_id)
        if for_update:
            statement = statement.with_for_update()
        return self._session.scalar(statement)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self._session.scalar(statement)

    def list_by_status(self, status: AccountStatus) -> list[User]:
        statement = (
            select(User)
            .where(User.account_status == status)
            .order_by(User.created_at.asc())
        )
        return list(self._session.scalars(statement))


class LotRepository(Protocol):
    def add(self, lot: Lot) -> None: ...

    def get(self, lot_id: UUID, *, for_update: bool = False) -> Lot | None: ...

    def list(self, status: LotStatus | None = None) -> list[Lot]: ...


class ReservationRepository(Protocol):
    def add(self, reservation: Reservation) -> None: ...


class TransportRepository(Protocol):
    def add(self, request: TransportRequest) -> None: ...

    def get(
        self, request_id: UUID, *, for_update: bool = False
    ) -> TransportRequest | None: ...

    def list(
        self, status: TransportStatus | None = None
    ) -> list[tuple[TransportRequest, Lot]]: ...


class SqlAlchemyLotRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, lot: Lot) -> None:
        self._session.add(lot)

    def get(self, lot_id: UUID, *, for_update: bool = False) -> Lot | None:
        statement = select(Lot).where(Lot.id == lot_id)
        if for_update:
            statement = statement.with_for_update()
        return self._session.scalar(statement)

    def list(self, status: LotStatus | None = None) -> list[Lot]:
        statement = select(Lot).order_by(Lot.created_at.desc())
        if status is not None:
            statement = statement.where(Lot.status == status)
        return list(self._session.scalars(statement))


class SqlAlchemyReservationRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, reservation: Reservation) -> None:
        self._session.add(reservation)


class SqlAlchemyTransportRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, request: TransportRequest) -> None:
        self._session.add(request)

    def get(
        self, request_id: UUID, *, for_update: bool = False
    ) -> TransportRequest | None:
        statement = select(TransportRequest).where(
            TransportRequest.id == request_id
        )
        if for_update:
            statement = statement.with_for_update()
        return self._session.scalar(statement)

    def list(
        self, status: TransportStatus | None = None
    ) -> list[tuple[TransportRequest, Lot]]:
        statement = (
            select(TransportRequest, Lot)
            .join(Lot, Lot.id == TransportRequest.lot_id)
            .order_by(TransportRequest.created_at.desc())
        )
        if status is not None:
            statement = statement.where(TransportRequest.status == status)
        return [
            (request, lot)
            for request, lot in self._session.execute(statement)
        ]
