from contextlib import asynccontextmanager
import logging
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from app.api.admin_routes import router as admin_router
from app.api.auth_routes import router as auth_router
from app.api.routes import router
from app.core.config import get_settings
from app.db.base import Base
from app.domain.errors import (
    InactiveAccountError,
    InvalidCredentialsError,
    ResourceConflictError,
    ResourceNotFoundError,
)

logger = logging.getLogger(__name__)


def create_app(database_url: str | None = None) -> FastAPI:
    resolved_database_url = database_url or get_settings().database_url
    engine = create_engine(resolved_database_url, pool_pre_ping=True)
    session_factory = sessionmaker(
        bind=engine,
        autoflush=False,
        expire_on_commit=False,
    )

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        yield
        engine.dispose()

    app = FastAPI(
        title="RescatAlimentos API",
        version="1.0.0",
        description="API MVP para lotes, reservas y solicitudes de transporte.",
        lifespan=lifespan,
    )
    app.state.engine = engine
    app.state.session_factory = session_factory
    app.include_router(router)
    app.include_router(auth_router)
    app.include_router(admin_router)

    @app.exception_handler(ResourceNotFoundError)
    async def not_found_handler(
        _: Request, error: ResourceNotFoundError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(error)},
        )

    @app.exception_handler(ResourceConflictError)
    async def conflict_handler(
        _: Request, error: ResourceConflictError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": str(error)},
        )

    @app.exception_handler(InvalidCredentialsError)
    async def invalid_credentials_handler(
        _: Request, error: InvalidCredentialsError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": str(error)},
            headers={"WWW-Authenticate": "Bearer"},
        )

    @app.exception_handler(InactiveAccountError)
    async def inactive_account_handler(
        _: Request, error: InactiveAccountError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"detail": str(error)},
        )

    @app.exception_handler(SQLAlchemyError)
    async def persistence_error_handler(
        _: Request, error: SQLAlchemyError
    ) -> JSONResponse:
        logger.error(
            "Database operation failed: %s",
            error,
            exc_info=(type(error), error, error.__traceback__),
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Ocurrió un error al acceder a los datos."},
        )

    return app


app = create_app()
