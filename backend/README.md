# RescatAlimentos API

Backend para el Sprint 2: autenticación y aprobación de usuarios, lotes,
reservas y solicitudes básicas de transporte.

## Requisitos

- Python 3.11 o superior
- PostgreSQL

No se requiere Docker para ejecutar o probar la API.

## Preparación local

Desde esta carpeta, crea y activa un entorno virtual, instala las dependencias y
copia `.env.example` a `.env`. Ajusta `DATABASE_URL` a tu instancia PostgreSQL:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

Aplica la migración inicial y arranca la API:

```powershell
alembic upgrade head
uvicorn app.main:app --reload
```

La documentación OpenAPI queda disponible en `http://127.0.0.1:8000/docs`.

Configura `JWT_SECRET_KEY` con una clave aleatoria de al menos 32 caracteres;
`JWT_ALGORITHM` y `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` también se leen del entorno.
El valor de `.env.example` es solo ilustrativo y no debe usarse en producción.

## Autenticación y aprobación

- `POST /api/v1/auth/registro` crea una cuenta `PENDIENTE`.
- `POST /api/v1/auth/login` emite un access token solo para cuentas `ACTIVO`.
- `GET /api/v1/admin/usuarios/pendientes` lista las cuentas por revisar.
- `POST /api/v1/admin/usuarios/{id}/aprobar` activa una cuenta pendiente.
- `POST /api/v1/admin/usuarios/{id}/rechazar` rechaza una cuenta pendiente y guarda el motivo.

Las rutas administrativas requieren un access token con rol `ADMIN`. La migración
`0002_user_rejection_reason` agrega el motivo de rechazo sin modificar la migración
inicial.

## Pruebas

```powershell
pytest
```

Las pruebas usan SQLite temporal y no necesitan una instancia PostgreSQL.

## Integración

Las rutas operativas y administrativas validan los access tokens Bearer mediante
`get_current_actor`; el rol y el ID provienen de claims firmados, no del body.

## Patrones implementados

- **Repository:** `app/repositories.py` encapsula consultas y escrituras de usuarios,
  lotes y transporte.
- **Unit of Work:** `app/unit_of_work.py` administra repositorios y confirma o
  revierte cada caso de uso como una transacción.
- **State:** `app/domain/states.py` encapsula las transiciones de cuentas, lotes y
  solicitudes logísticas.
