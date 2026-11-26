import getpass
import sys
from collections.abc import Callable

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.models import AccountStatus, User, UserRole
from app.domain.errors import PersistenceConflictError
from app.unit_of_work import SqlAlchemyUnitOfWork, UnitOfWork


class AdminBootstrapError(Exception):
    pass


def create_initial_admin(uow: UnitOfWork, email: str, password: str) -> str:
    try:
        normalized_email = str(TypeAdapter(EmailStr).validate_python(email)).lower()
    except ValidationError as error:
        raise AdminBootstrapError("El correo ingresado no es válido.") from error

    if not 8 <= len(password) <= 128:
        raise AdminBootstrapError(
            "La contraseña debe tener entre 8 y 128 caracteres."
        )

    try:
        with uow:
            uow.users.lock_admin_bootstrap()
            if uow.users.has_role(UserRole.ADMIN):
                raise AdminBootstrapError(
                    "Ya existe una cuenta ADMIN. No se creó otra."
                )
            if uow.users.get_by_email(normalized_email) is not None:
                raise AdminBootstrapError(
                    "Ya existe una cuenta con ese correo."
                )

            admin = User(
                email=normalized_email,
                password_hash=hash_password(password),
                role=UserRole.ADMIN,
                account_status=AccountStatus.ACTIVO,
            )
            uow.users.add(admin)
            uow.flush()
            return admin.email
    except PersistenceConflictError as error:
        raise AdminBootstrapError(
            "No se pudo crear la cuenta por un conflicto de datos. "
            "Verifica si ya existe un administrador o si el correo está en uso."
        ) from error


def prompt_for_admin() -> tuple[str, str]:
    try:
        email = input("Correo del administrador: ").strip()
        try:
            TypeAdapter(EmailStr).validate_python(email)
        except ValidationError as error:
            raise AdminBootstrapError("El correo ingresado no es válido.") from error

        password = getpass.getpass("Contraseña (8 a 128 caracteres): ")
        confirmation = getpass.getpass("Repite la contraseña: ")
        if password != confirmation:
            raise AdminBootstrapError("Las contraseñas no coinciden.")
        return email, password
    except EOFError as error:
        raise AdminBootstrapError("No se recibieron los datos de entrada.") from error


def run_bootstrap(
    email: str,
    password: str,
    session_factory: Callable[[], Session],
) -> str:
    uow = SqlAlchemyUnitOfWork(session_factory)
    return create_initial_admin(uow, email, password)


def main() -> int:
    try:
        email, password = prompt_for_admin()
        settings = get_settings()
        engine = create_engine(settings.database_url, pool_pre_ping=True)
        session_factory = sessionmaker(
            bind=engine,
            autoflush=False,
            expire_on_commit=False,
        )
        try:
            created_email = run_bootstrap(email, password, session_factory)
        finally:
            engine.dispose()
    except AdminBootstrapError as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    except ValidationError:
        print(
            "Error: revisa la configuración requerida en backend\\.env.",
            file=sys.stderr,
        )
        return 1
    except SQLAlchemyError:
        print(
            "Error: no se pudo acceder a PostgreSQL. Revisa DATABASE_URL "
            "y que el servidor esté encendido.",
            file=sys.stderr,
        )
        return 1
    except KeyboardInterrupt:
        print("\nCreación cancelada.", file=sys.stderr)
        return 130

    print(f"Cuenta ADMIN activa creada para {created_email}.")
    print("Inicia sesión con estas credenciales en POST /api/v1/auth/login.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
