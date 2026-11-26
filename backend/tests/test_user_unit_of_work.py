import pytest

from app.db.models import AccountStatus, User, UserRole
from app.unit_of_work import SqlAlchemyUnitOfWork


def test_unit_of_work_rolls_back_user_when_operation_fails(client) -> None:
    email = "rollback@example.test"
    uow = SqlAlchemyUnitOfWork(client.app.state.session_factory)

    with pytest.raises(RuntimeError, match="operation failed"):
        with uow:
            uow.users.add(
                User(
                    email=email,
                    password_hash="not-a-real-password-hash",
                    role=UserRole.DONANTE,
                    account_status=AccountStatus.PENDIENTE,
                )
            )
            uow.flush()
            raise RuntimeError("operation failed")

    with SqlAlchemyUnitOfWork(client.app.state.session_factory) as verification:
        assert verification.users.get_by_email(email) is None
