from uuid import uuid4

import pytest

from app.core.security import (
    InvalidAccessTokenError,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.db.models import UserRole


def test_password_hash_is_not_plaintext_and_verifies_correctly() -> None:
    password = "secure password 123"
    hashed_password = hash_password(password)

    assert hashed_password != password
    assert verify_password(password, hashed_password)
    assert not verify_password("incorrect password", hashed_password)


def test_access_token_round_trip_preserves_subject_and_role() -> None:
    subject = uuid4()

    token = create_access_token(subject, UserRole.DONANTE)
    claims = decode_access_token(token)

    assert claims.subject == subject
    assert claims.role is UserRole.DONANTE


def test_invalid_access_token_is_rejected() -> None:
    with pytest.raises(InvalidAccessTokenError):
        decode_access_token("not-a-valid-jwt")
