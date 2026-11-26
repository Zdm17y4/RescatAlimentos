import os
from collections.abc import Iterator
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault(
    "JWT_SECRET_KEY",
    "test-only-secret-key-that-is-at-least-thirty-two-bytes",
)

from app.api.dependencies import AuthenticatedActor, get_current_actor
from app.db.base import Base
from app.db.models import AccountStatus, User, UserRole
from app.main import create_app


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(
        bind=engine,
        autoflush=False,
        expire_on_commit=False,
    )
    app = create_app("sqlite://")
    app.state.engine.dispose()
    app.state.engine = engine
    app.state.session_factory = session_factory

    actor = AuthenticatedActor(user_id=uuid4(), role=UserRole.DONANTE)
    actors = {"current": actor}

    def current_actor() -> AuthenticatedActor:
        return actors["current"]

    app.dependency_overrides[get_current_actor] = current_actor
    with session_factory() as session:
        users = []
        for role in UserRole:
            user = User(
                id=actor.user_id if role is UserRole.DONANTE else uuid4(),
                email=f"{role.value.lower()}@example.test",
                password_hash="test-hash",
                role=role,
                account_status=AccountStatus.ACTIVO,
            )
            users.append(user)
            session.add(user)
        session.commit()
        user_ids = {user.role: user.id for user in users}

    with TestClient(app) as test_client:
        test_client.actors = actors
        test_client.user_ids = user_ids
        yield test_client

    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def use_actor(client: TestClient):
    def set_actor(role: UserRole) -> UUID:
        user_id = client.user_ids[role]
        client.actors["current"] = AuthenticatedActor(user_id=user_id, role=role)
        return user_id

    return set_actor
