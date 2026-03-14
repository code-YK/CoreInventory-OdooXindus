# CoreInventory — Setup Guide

Step-by-step instructions to set up and run the CoreInventory backend.

---

## Prerequisites

- **Python 3.10+** installed
- **PostgreSQL** installed and running
- **Git** (optional)

---

## 1. Create Virtual Environment

```bash
# Navigate to the backend folder
cd backend

# Create venv (skip if already exists)
python -m venv venv
```

---

## 2. Activate Virtual Environment

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

---

## 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create a `.env` file in the `backend/` folder (or edit the existing one):

```env
DATABASE_URL=postgresql://username:password@host:port/coreinventory
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### `.env` Examples

**Localhost:**
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/coreinventory
```

**Remote server:**
```env
DATABASE_URL=postgresql://postgres:mypassword@192.168.1.100:5432/coreinventory
```

### ⚠️ Special Characters in Password

If your password contains special characters, **URL-encode** them:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `#` | `%23` |
| `%` | `%25` |

**Example:** Password `code@22` → `code%4022`
```env
DATABASE_URL=postgresql://postgres:code%4022@localhost:5432/coreinventory
```

---

## 5. Create the Database

The database must exist in PostgreSQL before running migrations.

**Using psql:**
```bash
psql -U postgres -c "CREATE DATABASE coreinventory;"
```

**Using pgAdmin:**
1. Open pgAdmin
2. Right-click on "Databases" → Create → Database
3. Name it `coreinventory`
4. Click Save

---

## 6. Run Database Migrations

This creates all 8 tables in the database:

```bash
# Windows
venv\Scripts\alembic.exe upgrade head

# Linux / macOS
alembic upgrade head
```

**Expected output:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial, Initial schema - all 8 tables
```

---

## 7. Seed Sample Data (Optional)

Populates the database with sample Indian-style data (users, products, warehouses, inventory, operations):

```bash
# Windows
venv\Scripts\python.exe scripts\seed.py

# Linux / macOS
python scripts/seed.py
```

**Default login credentials after seeding:**

| Email | Password | Role |
|-------|----------|------|
| rajesh.kumar@coreinventory.in | admin123 | Admin |
| priya.sharma@coreinventory.in | staff123 | Staff |
| amit.patel@coreinventory.in | staff123 | Staff |
| sneha.reddy@coreinventory.in | staff123 | Staff |
| vikram.singh@coreinventory.in | staff123 | Staff |

---

## 8. Run the Backend Server

```bash
# Windows
venv\Scripts\uvicorn.exe app.main:app --reload

# Linux / macOS
uvicorn app.main:app --reload
```

**With custom host/port:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server starts at: **http://localhost:8000**

---

## 9. Access API Documentation

Once the server is running, open your browser:

| URL | Description |
|-----|-------------|
| http://localhost:8000/docs | Swagger UI (interactive) |
| http://localhost:8000/redoc | ReDoc (read-only) |

---

## Quick Command Reference

| Action | Command |
|--------|---------|
| Activate venv | `venv\Scripts\Activate.ps1` |
| Install deps | `pip install -r requirements.txt` |
| Run migrations | `venv\Scripts\alembic.exe upgrade head` |
| Seed data | `venv\Scripts\python.exe scripts\seed.py` |
| Start server | `venv\Scripts\uvicorn.exe app.main:app --reload` |
| Rollback migration | `venv\Scripts\alembic.exe downgrade -1` |
| Check migration status | `venv\Scripts\alembic.exe current` |
| View migration history | `venv\Scripts\alembic.exe history` |

---

## Troubleshooting

### `psycopg2-binary` fails to install
→ Try upgrading pip first: `pip install --upgrade pip`, then retry.

### `could not translate host name` error
→ Your password likely contains `@`. URL-encode it as `%40` in the `.env` file.

### `invalid interpolation syntax` error
→ This is fixed in the codebase. The `migrations/env.py` creates the engine directly instead of going through Alembic's configparser.

### `relation does not exist` error
→ You haven't run migrations yet. Run `alembic upgrade head`.

### Server won't start / port in use
→ Use a different port: `uvicorn app.main:app --reload --port 8001`
