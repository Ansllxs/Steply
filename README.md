# Steply

App de hábitos con grupos y retos. Un hábito se forma por medio de un reto, que puede ser personal o grupal, con puntos, rachas, insignias y evidencias con foto.

## Estructura del repositorio

```
Steply/
  backend/      API con Express (Integrante 2)
  database/     Base de datos con Prisma y lógica de hábitos (Integrante 3)
  frontend/     Pantallas de la app (Integrante 1)
  .github/      Pruebas automáticas
  docker-compose.yml   PostgreSQL local
  package.json  Coordina los workspaces de npm
```

## Qué necesita tener instalado

- Node.js 20 o superior
- Git
- Docker Desktop (para la base de datos local)

## Cómo instalar y correr el proyecto

1. Clonar el repositorio y pasarse a la rama de su parte (`backend`, `database` o `frontend`).

2. Instalar las librerías desde la raíz. Esto instala backend y database juntos.

```bash
npm install
```

3. Levantar PostgreSQL con Docker, desde la raíz.

```bash
docker compose up -d
```

4. Crear los archivos `.env`. Se copian desde el ejemplo y se les ponen los valores reales. Nunca se suben a GitHub.

```bash
cp database/.env.example database/.env
cp backend/.env.example backend/.env
```

El `backend/.env` necesita estas variables.

```
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/steply?schema=public"
JWT_SECRET="una-clave-larga-y-aleatoria"
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Para generar el `JWT_SECRET` se puede correr esto y pegar el resultado.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. Crear las tablas y cargar los datos de prueba.

```bash
npm run db:migrate
npm run db:seed
```

6. Correr el backend en modo desarrollo.

```bash
npm run dev
```

7. Comprobar que todo está conectado abriendo estas direcciones.

- `http://localhost:3000/api/salud` muestra que el servidor está funcionando.
- `http://localhost:3000/api/salud-bd` muestra la cantidad de usuarios (con el seed son 6).

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Corre el backend con reinicio automático |
| `npm run db:migrate` | Aplica los cambios del esquema a la base |
| `npm run db:seed` | Carga insignias y datos de prueba |
| `npm run db:studio` | Abre un panel web para ver las tablas |
| `docker compose up -d` | Enciende PostgreSQL |
| `docker compose down` | Apaga PostgreSQL (los datos se conservan) |

## Usuarios de prueba

La contraseña de todos es `Steply123!`.

| Correo | Nota |
|---|---|
| angie@ejemplo.com | Administradora del grupo "Compu squad" |
| valentina@ejemplo.com | Integrante |
| diego@ejemplo.com | Integrante |
| sofia@ejemplo.com | Integrante |
| carlos@ejemplo.com | Integrante |
| admin@steply.app | Administrador general |

## Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| Express 5 | API y rutas |
| PostgreSQL 16 con Prisma 6.19.3 | Base de datos |
| bcryptjs | Proteger las contraseñas |
| jsonwebtoken | Tokens de sesión |
| express-validator | Validar los datos que llegan |
| multer y Cloudinary | Subir y guardar las fotos de evidencia |
| cors | Permitir que el frontend llame a la API |
| dotenv y nodemon | Variables de entorno y reinicio en desarrollo |

Todo el equipo debe usar la misma versión de Prisma (6.19.3). No se actualiza sin avisar.

## Endpoints del backend

Disponibles hoy

- `GET /api/salud`
- `GET /api/salud-bd`

