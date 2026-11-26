from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.models import AccountStatus, User, UserRole


def add_user(
    client: TestClient,
    email: str,
    role: UserRole,
    status: AccountStatus,
    password: str = "correct horse battery",
) -> User:
    user = User(
        email=email,
        password_hash=hash_password(password),
        role=role,
        account_status=status,
    )
    with client.app.state.session_factory() as session:
        session.add(user)
        session.commit()
        session.refresh(user)
    return user


def login(client: TestClient, email: str, password: str) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    return response.json()


def admin_token(client: TestClient) -> str:
    admin = add_user(
        client,
        "admin-auth@example.com",
        UserRole.ADMIN,
        AccountStatus.ACTIVO,
    )
    result = login(client, admin.email, "correct horse battery")
    assert "access_token" in result
    return result["access_token"]


def test_registration_creates_pending_user_without_exposing_hash(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/v1/auth/registro",
        json={
            "email": "new-donor@example.com",
            "password": "secure password 123",
            "role": "DONANTE",
            "address": "Av. Central 123",
        },
    )

    assert response.status_code == 201
    assert response.json()["account_status"] == "PENDIENTE"
    assert "password_hash" not in response.json()
    assert "password" not in response.json()
    with client.app.state.session_factory() as session:
        user = session.get(User, UUID(response.json()["id"]))
        assert user is not None
        assert user.password_hash.startswith("$argon2id$")
        assert user.password_hash != "secure password 123"


def test_login_requires_correct_password_and_active_account(
    client: TestClient,
) -> None:
    active = add_user(
        client, "active@example.com", UserRole.DONANTE, AccountStatus.ACTIVO
    )
    pending = add_user(
        client, "pending@example.com", UserRole.COMEDOR, AccountStatus.PENDIENTE
    )
    rejected = add_user(
        client, "rejected@example.com", UserRole.DRIVER, AccountStatus.RECHAZADO
    )

    wrong_password = client.post(
        "/api/v1/auth/login",
        json={"email": active.email, "password": "incorrect password"},
    )
    active_login = client.post(
        "/api/v1/auth/login",
        json={"email": active.email, "password": "correct horse battery"},
    )
    pending_login = client.post(
        "/api/v1/auth/login",
        json={"email": pending.email, "password": "correct horse battery"},
    )
    rejected_login = client.post(
        "/api/v1/auth/login",
        json={"email": rejected.email, "password": "correct horse battery"},
    )

    assert wrong_password.status_code == 401
    assert active_login.status_code == 200
    assert active_login.json()["token_type"] == "bearer"
    assert pending_login.status_code == 403
    assert rejected_login.status_code == 403


def test_jwt_validation_and_role_authorization(client: TestClient) -> None:
    client.app.dependency_overrides.clear()
    comedor = add_user(
        client, "dining@example.com", UserRole.COMEDOR, AccountStatus.ACTIVO
    )
    donor = add_user(
        client, "donor@example.com", UserRole.DONANTE, AccountStatus.ACTIVO
    )
    comedor_token = login(client, comedor.email, "correct horse battery")[
        "access_token"
    ]
    donor_token = login(client, donor.email, "correct horse battery")[
        "access_token"
    ]
    settings = get_settings()
    claims = jwt.decode(
        comedor_token,
        settings.jwt_secret_key.get_secret_value(),
        algorithms=[settings.jwt_algorithm],
    )
    expired_token = jwt.encode(
        {
            "sub": str(comedor.id),
            "role": UserRole.COMEDOR.value,
            "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
        },
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )
    bad_signature = comedor_token.rsplit(".", 1)[0] + ".invalid-signature"

    valid_response = client.get(
        "/api/v1/lotes",
        headers={"Authorization": f"Bearer {comedor_token}"},
    )
    expired_response = client.get(
        "/api/v1/lotes",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    invalid_signature_response = client.get(
        "/api/v1/lotes",
        headers={"Authorization": f"Bearer {bad_signature}"},
    )
    insufficient_role_response = client.get(
        "/api/v1/lotes",
        headers={"Authorization": f"Bearer {donor_token}"},
    )

    assert claims["sub"] == str(comedor.id)
    assert claims["role"] == UserRole.COMEDOR.value
    assert "exp" in claims
    assert valid_response.status_code == 200
    assert expired_response.status_code == 401
    assert invalid_signature_response.status_code == 401
    assert insufficient_role_response.status_code == 403


def test_admin_endpoints_require_admin_and_enforce_account_transitions(
    client: TestClient,
) -> None:
    client.app.dependency_overrides.clear()
    token = admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    pending_one = client.post(
        "/api/v1/auth/registro",
        json={
            "email": "approve-me@example.com",
            "password": "secure password 123",
            "role": "DONANTE",
        },
    ).json()
    pending_two = client.post(
        "/api/v1/auth/registro",
        json={
            "email": "reject-me@example.com",
            "password": "secure password 123",
            "role": "COMEDOR",
        },
    ).json()

    unauthenticated = client.get("/api/v1/admin/usuarios/pendientes")
    pending_list = client.get(
        "/api/v1/admin/usuarios/pendientes", headers=headers
    )
    approved = client.post(
        f"/api/v1/admin/usuarios/{pending_one['id']}/aprobar",
        headers=headers,
    )
    reapproved = client.post(
        f"/api/v1/admin/usuarios/{pending_one['id']}/aprobar",
        headers=headers,
    )
    rejected = client.post(
        f"/api/v1/admin/usuarios/{pending_two['id']}/rechazar",
        headers=headers,
        json={"reason": "No se pudo validar la dirección"},
    )
    rerejected = client.post(
        f"/api/v1/admin/usuarios/{pending_two['id']}/rechazar",
        headers=headers,
        json={"reason": "Otro motivo"},
    )

    assert unauthenticated.status_code == 401
    assert pending_list.status_code == 200
    assert {user["email"] for user in pending_list.json()} >= {
        "approve-me@example.com",
        "reject-me@example.com",
    }
    assert approved.status_code == 200
    assert approved.json()["account_status"] == "ACTIVO"
    assert reapproved.status_code == 409
    assert rejected.status_code == 200
    assert rejected.json()["account_status"] == "RECHAZADO"
    assert rejected.json()["rejection_reason"] == "No se pudo validar la dirección"
    assert rerejected.status_code == 409
    openapi = client.get("/openapi.json").json()
    assert (
        "409"
        in openapi["paths"][
            "/api/v1/admin/usuarios/{user_id}/aprobar"
        ]["post"]["responses"]
    )


def test_non_admin_role_cannot_access_administration(client: TestClient) -> None:
    donor = add_user(
        client,         "regular-donor@example.com", UserRole.DONANTE, AccountStatus.ACTIVO
    )
    token = login(client, donor.email, "correct horse battery")["access_token"]

    response = client.get(
        "/api/v1/admin/usuarios/pendientes",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403
