from __future__ import annotations

from collections.abc import Callable, Iterator
from typing import Protocol

from fastapi import Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domain.errors import PersistenceConflictError
from app.repositories import (
    LotRepository,
    ReservationRepository,
    SqlAlchemyLotRepository,
    SqlAlchemyReservationRepository,
    SqlAlchemyTransportRepository,
    SqlAlchemyUserRepository,
    TransportRepository,
    UserRepository,
)


class UnitOfWork(Protocol):
    users: UserRepository
    lotes: LotRepository
    reservas: ReservationRepository
    transporte: TransportRepository

    def __enter__(self) -> UnitOfWork: ...

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> bool: ...

    def flush(self) -> None: ...


class SqlAlchemyUnitOfWork:
    users: UserRepository
    lotes: LotRepository
    reservas: ReservationRepository
    transporte: TransportRepository

    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self._session_factory = session_factory
        self._session: Session | None = None

    def __enter__(self) -> SqlAlchemyUnitOfWork:
        session = self._session_factory()
        self._session = session
        self.users = SqlAlchemyUserRepository(session)
        self.lotes = SqlAlchemyLotRepository(session)
        self.reservas = SqlAlchemyReservationRepository(session)
        self.transporte = SqlAlchemyTransportRepository(session)
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> bool:
        if self._session is None:
            return False
        try:
            if exc_type is None:
                try:
                    self._session.commit()
                except IntegrityError as error:
                    self._session.rollback()
                    raise PersistenceConflictError(
                        "La operación viola una restricción de persistencia."
                    ) from error
            else:
                self._session.rollback()
        finally:
            self._session.close()
            self._session = None
        return False

    def flush(self) -> None:
        if self._session is None:
            raise RuntimeError("La unidad de trabajo no está activa.")
        try:
            self._session.flush()
        except IntegrityError as error:
            self._session.rollback()
            raise PersistenceConflictError(
                "La operación viola una restricción de persistencia."
            ) from error


def get_unit_of_work(request: Request) -> Iterator[UnitOfWork]:
    factory = request.app.state.session_factory
    yield SqlAlchemyUnitOfWork(factory)
