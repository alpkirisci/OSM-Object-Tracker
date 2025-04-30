# Database Migrations

This directory contains database migrations for the OpenStreetMap Object Tracking application.

## Using Alembic

Alembic is used for database migrations. To initialize Alembic:

```bash
cd backend
alembic init migrations
```

Update `alembic.ini` with your database connection string.

## Creating Migrations

Generate a new migration:

```bash
alembic revision --autogenerate -m "Create initial tables"
```

## Applying Migrations

Apply all migrations:

```bash
alembic upgrade head
```

Apply to a specific revision:

```bash
alembic upgrade <revision_id>
```

## Rolling Back

Rollback to a previous revision:

```bash
alembic downgrade <revision_id>
```

Rollback one version:

```bash
alembic downgrade -1
``` 