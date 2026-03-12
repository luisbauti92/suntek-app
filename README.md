# SUNTEK

Fullstack project with .NET 10 backend (Clean Architecture) and React 19 frontend.

## Structure

```
SUNTEK/
├── backend/
│   ├── src/
│   │   ├── Suntek.Api/           # Entry point, FastEndpoints, Auth
│   │   ├── Suntek.Application/   # Use cases, MediatR, DTOs
│   │   ├── Suntek.Domain/        # Entities, Enums, Repository interfaces
│   │   └── Suntek.Infrastructure/# EF Core, PostgreSQL, Identity
│   └── Suntek.slnx
├── frontend/                     # React 19 + Vite + TypeScript
└── Suntek.slnx                   # Root solution (Rider)
```

## Backend (Clean Architecture)

| Project | Purpose | Dependencies |
|---------|---------|--------------|
| **Suntek.Domain** | Entities, Enums, Repository interfaces | None |
| **Suntek.Application** | Commands, Queries, MediatR handlers | Domain |
| **Suntek.Infrastructure** | DbContext, Identity, Repositories | Application |
| **Suntek.Api** | FastEndpoints, JWT, Middleware | Application, Infrastructure |

### Configuration

1. Set connection string in `backend/src/Suntek.Api/appsettings.json`

2. Apply migrations and run:
   ```bash
   cd backend
   dotnet ef database update --project src/Suntek.Infrastructure --startup-project src/Suntek.Api
   dotnet run --project src/Suntek.Api
   ```
   API runs at `http://localhost:5227`

### Default Admin

- Email: `admin@suntek.com`
- Password: `Admin@123`

### API Documentation

In Development mode only:
- **Scalar UI**: `http://localhost:5227/scalar`
- **Swagger JSON**: `http://localhost:5227/swagger/v1/swagger.json`

JWT Bearer auth is supported: paste your token in the Authorize dialog to test protected endpoints.

### Endpoints

| Method | Route | Auth | Roles |
|--------|-------|------|-------|
| GET | `/api/health` | Anonymous | - |
| POST | `/api/auth/login` | Anonymous | - |
| POST | `/api/auth/register` | Anonymous | - |
| GET | `/api/inventory` | JWT | Admin, Operator |
| POST | `/api/inventory` | JWT | Admin, Operator |
| PUT | `/api/inventory/{id}` | JWT | Admin |
| DELETE | `/api/inventory/{id}` | JWT | Admin |

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Rider

Open `Suntek.slnx` or `backend/Suntek.slnx`.
