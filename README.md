# Steply

Aplicación web responsive para formar hábitos por medio de retos personales y
grupales, con rachas, puntos, castigos y evidencias.
Proyecto II - Requerimientos de Software - TEC - II semestre 2026.

| Carpeta | Contenido | Responsable |
|---|---|---|
| `database/` | Base de datos PostgreSQL (Prisma) y lógica de hábitos-reto | Integrante 3 |
| `backend/` | Servidor, API, autenticación (bcrypt) y roles *(pendiente)* | Integrante 2 |
| `frontend/` | Interfaz responsive *(pendiente)* | Integrante 1 |

## Inicio rápido de la base de datos

```bash
docker compose up -d
cd database && cp .env.example .env && npm install
npm run db:deploy && npm run db:seed
npm run prototipo      # página de prueba en http://localhost:3000
```

Detalles, modelo de datos y guía de integración: [`database/README.md`](database/README.md).
