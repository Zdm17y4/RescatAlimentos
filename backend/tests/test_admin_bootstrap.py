from collections.abc import Iterator
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.cli.bootstrap_admin import (
    AdminBootstrapError,
    prompt_for_admin,
    run_bootstrap,
)
from app.db.base import Base
from app.db.models import AccountStatus, User, UserRole


@pytest.fixture
def session_factory() -> Iterator[sessionmaker[Session]]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(
        bind=engine,
        autoflush=False,
        expire_on_commit=False,
    )
    yield factory
    engine.dispose()


def test_bootstrap_creates_active_admin_with_hashed_password(
    session_factory: sessionmaker[Session],
) -> None:
    created_email = run_bootstrap(
        "First.Admin@example.com",
        "secure-admin-password",
        session_factory,
    )

    assert created_email == "first.admin@example.com"
    with session_factory() as session:
        admin = session.scalar(select(User).where(User.email == created_email))
        assert admin is not None
        assert admin.role is UserRole.ADMIN
        assert admin.account_status is AccountStatus.ACTIVO
        assert admin.password_hash.startswith("$argon2id$")
        assert admin.password_hash != "secure-admin-password"


def test_bootstrap_refuses_to_create_a_second_admin(
    session_factory: sessionmaker[Session],
) -> None:
    run_bootstrap("first@example.com", "secure-admin-password", session_factory)

    with pytest.raises(AdminBootstrapError, match="Ya existe una cuenta ADMIN"):
        run_bootstrap("second@example.com", "secure-admin-password", session_factory)


@pytest.mark.parametrize(
    ("email", "password", "message"),
    [
        ("not-an-email", "secure-admin-password", "correo"),
        ("new@example.com", "short", "8 y 128"),
    ],
)
def test_bootstrap_validates_email_and_password(
    session_factory: sessionmaker[Session],
    email: str,
    password: str,
    message: str,
) -> None:
    with pytest.raises(AdminBootstrapError, match=message):
        run_bootstrap(email, password, session_factory)


def test_bootstrap_refuses_an_email_already_in_use(
    session_factory: sessionmaker[Session],
) -> None:
    with session_factory() as session:
        session.add(
            User(
                email="already-used@example.com",
                password_hash="existing-hash",
                role=UserRole.DONANTE,
                account_status=AccountStatus.PENDIENTE,
            )
        )
        session.commit()

    with pytest.raises(AdminBootstrapError, match="correo"):
        run_bootstrap(
            "already-used@example.com",
            "secure-admin-password",
            session_factory,
        )


def test_admin_prompt_confirms_password_without_echoing_it() -> None:
    with (
        patch("builtins.input", return_value="admin@example.com"),
        patch(
            "app.cli.bootstrap_admin.getpass.getpass",
            side_effect=["secret123", "secret123"],
        ) as prompt,
    ):
        email, password = prompt_for_admin()

    assert email == "admin@example.com"
    assert password == "secret123"
    assert prompt.call_count == 2


def test_admin_prompt_rejects_mismatched_passwords() -> None:
    with (
        patch("builtins.input", return_value="admin@example.com"),
        patch("app.cli.bootstrap_admin.getpass.getpass", side_effect=["secret123", "different"]),
        pytest.raises(AdminBootstrapError, match="no coinciden"),
    ):
        prompt_for_admin()
