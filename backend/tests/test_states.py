from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.db.models import AccountStatus, LotStatus, TransportStatus
from app.domain.errors import InvalidTransitionError
from app.domain.states import AccountLifecycle, LotLifecycle, TransportLifecycle


def test_account_state_allows_only_pending_to_processed() -> None:
    pending = AccountLifecycle.from_values(AccountStatus.PENDIENTE)
    pending.approve()

    assert pending.status is AccountStatus.ACTIVO
    with pytest.raises(InvalidTransitionError, match="ya fue procesada"):
        pending.approve()
    with pytest.raises(InvalidTransitionError, match="ya fue procesada"):
        pending.reject("No permitido")

    rejected = AccountLifecycle.from_values(AccountStatus.PENDIENTE)
    rejected.reject("Documentación incompleta")

    assert rejected.status is AccountStatus.RECHAZADO
    assert rejected.rejection_reason == "Documentación incompleta"
    with pytest.raises(InvalidTransitionError, match="ya fue procesada"):
        rejected.approve()
    with pytest.raises(InvalidTransitionError, match="ya fue procesada"):
        rejected.reject("Otro motivo")


def test_account_rejection_requires_a_non_empty_reason() -> None:
    lifecycle = AccountLifecycle.from_values(AccountStatus.PENDIENTE)

    with pytest.raises(ValueError, match="no puede estar vacío"):
        lifecycle.reject("   ")


def test_lot_state_allows_only_available_to_reserved() -> None:
    lifecycle = LotLifecycle.from_status(LotStatus.DISPONIBLE)
    lifecycle.reserve()

    assert lifecycle.status is LotStatus.RESERVADO
    with pytest.raises(InvalidTransitionError):
        lifecycle.reserve()


def test_transport_state_requires_driver_when_assigned() -> None:
    with pytest.raises(InvalidTransitionError):
        TransportLifecycle.from_values(TransportStatus.ASIGNADA, None, None)

    lifecycle = TransportLifecycle.from_values(
        TransportStatus.DISPONIBLE,
        None,
        None,
    )
    driver_id = uuid4()
    lifecycle.assign(driver_id)

    assert lifecycle.status is TransportStatus.ASIGNADA
    assert lifecycle.driver_id == driver_id
    assert lifecycle.assigned_at is not None
    with pytest.raises(InvalidTransitionError):
        lifecycle.assign(uuid4())
