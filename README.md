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

1. Clonar el repositorio. El trabajo integrado está en `main`.

2. Instalar las librerías desde la raíz. Esto instala backend y database juntos. El frontend se instala en su carpeta.

```bash
npm install
cd frontend && npm install
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

6. Correr el backend en modo desarrollo, desde la raíz.

```bash
npm run dev
```

7. Correr el frontend en otra terminal.

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

La aplicación queda en `http://127.0.0.1:5173`. La API queda en `http://localhost:3000/api`.

8. Comprobar que todo está conectado abriendo estas direcciones.

- `http://localhost:3000/api/salud` muestra que el servidor está funcionando.
- `http://localhost:3000/api/salud-bd` muestra la cantidad de usuarios (con el seed son 6).

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Corre el backend con reinicio automático |
| `cd frontend && npm run dev` | Corre la aplicación |
| `cd frontend && npm run lint` | Revisa el frontend |
| `cd frontend && npm run build` | Genera la versión de producción del frontend |
| `cd database && npm test` | Corre las pruebas de la base en `steply_test` |
| `npm run db:migrate` | Aplica los cambios del esquema a la base |
| `npm run db:seed` | Carga insignias y datos de prueba |
| `npm run db:studio` | Abre un panel web para ver las tablas |
| `npm run db:deploy` | Aplica las migraciones en una base desplegada (sin borrar datos) |
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

Todas las rutas empiezan con `/api` y reciben y devuelven JSON. Las que piden token usan el header `Authorization: Bearer <token>`. El token dura 7 días.

| Método | Ruta | Token | Cuerpo de ejemplo | Respuesta |
|---|---|---|---|---|
| GET | `/api/salud` | No | | 200 `{ ok, mensaje }` |
| GET | `/api/salud-bd` | No | | 200 `{ ok, usuarios }` |
| POST | `/api/auth/registro` | No | `{ "nombre": "Ana", "nombreUsuario": "ana", "correo": "ana@ejemplo.com", "password": "Clave1234" }` | 201 `{ usuario, token }` |
| POST | `/api/auth/login` | No | `{ "identificador": "ana", "password": "Clave1234" }` El identificador puede ser el correo o el usuario | 200 `{ usuario, token }` |
| GET | `/api/auth/me` | Sí | | 200 `{ usuario }` |
| POST | `/api/auth/cambiar-password` | Sí | `{ "actual": "Clave1234", "nueva": "Nueva12345" }` | 200 `{ mensaje, token }`. El token nuevo reemplaza al anterior. Los demás tokens de esa cuenta dejan de servir |

### Perfil y usuarios

| Método | Ruta | Token | Cuerpo de ejemplo | Respuesta |
|---|---|---|---|---|
| GET | `/api/usuarios/me` | Sí | | 200 `{ usuario }` |
| PATCH | `/api/usuarios/me` | Sí | `{ "nombre": "Ana", "nombreUsuario": "ana", "descripcion": "Me gusta correr", "zonaHoraria": "America/Costa_Rica" }` (todo opcional) | 200 `{ usuario }` |
| PUT | `/api/usuarios/me/foto` | Sí | `multipart/form-data` con el archivo en el campo `foto` (JPG, PNG, WEBP o HEIC, máximo 5 MB) | 200 `{ usuario }` |
| GET | `/api/usuarios?buscar=ana` | Sí | Busca por nombre de usuario, de 2 a 30 caracteres. No devuelve correos | 200 `{ usuarios }` |
| GET | `/api/usuarios/:id` | Sí | | 200 `{ usuario: { id, nombre, fotoUrl, descripcion, puntosTotales, insignias } }` |

### Amistades

| Método | Ruta | Token | Cuerpo de ejemplo | Respuesta |
|---|---|---|---|---|
| POST | `/api/amistades` | Sí | `{ "usuarioId": "<uuid>" }` | 201 `{ amistad }`, 409 si ya existe una solicitud o ya son amigos |
| GET | `/api/amistades` | Sí | | 200 `{ amigos, recibidas, enviadas }`, cada uno con `{ amistadId, usuario, desde }` |
| POST | `/api/amistades/:id/aceptar` | Sí | Solo quien recibió la solicitud | 200 `{ amistad }` |
| POST | `/api/amistades/:id/rechazar` | Sí | Solo quien recibió la solicitud | 200 `{ amistad }` |
| DELETE | `/api/amistades/:id` | Sí | Cancela una solicitud o elimina la amistad | 204 |

### Grupos

| Método | Ruta | Token | Cuerpo de ejemplo | Respuesta |
|---|---|---|---|---|
| POST | `/api/grupos` | Sí | `{ "nombre": "Corredores", "descripcion": "...", "soloAdminsCreanRetos": false }` | 201 `{ grupo }`, el creador queda como ADMIN |
| GET | `/api/grupos` | Sí | | 200 `{ grupos }` con `miRol` y `cantidadMiembros` |
| GET | `/api/grupos/:id` | Sí, ser miembro | | 200 `{ grupo }` con `miembros: [{ id, nombre, fotoUrl, rol }]` |
| POST | `/api/grupos/unirse` | Sí | `{ "codigo": "COMPU-SQUAD-DEMO" }` | 201 `{ grupo }`, 409 si ya es miembro |
| PATCH | `/api/grupos/:id` | Sí, admin | `{ "nombre": "...", "descripcion": "...", "soloAdminsCreanRetos": true }` | 200 `{ grupo }` |
| POST | `/api/grupos/:id/regenerar-codigo` | Sí, admin | | 200 `{ codigoInvitacion }` |
| DELETE | `/api/grupos/:id` | Sí, admin | Borra también sus retos | 204 |
| PATCH | `/api/grupos/:id/miembros/:usuarioId` | Sí, admin | `{ "rol": "ADMIN" }` o `{ "rol": "INTEGRANTE" }` | 200 `{ grupo }` |
| DELETE | `/api/grupos/:id/miembros/:usuarioId` | Sí, admin | Quita a un miembro | 204 |
| DELETE | `/api/grupos/:id/miembros/me` | Sí | Salir del grupo | 204 |

| GET | `/api/grupos/:id/retos` | Sí, ser miembro | `?terminados=true` para incluir los terminados | 200 `{ retos }` |
| GET | `/api/grupos/:id/ranking` | Sí, ser miembro | | 200 `{ ranking }` |

### Invitaciones a grupos

| Método | Ruta | Token | Cuerpo de ejemplo | Respuesta |
|---|---|---|---|---|
| GET | `/api/grupos/invitaciones` | Sí | | 200 `{ invitaciones }` recibidas |
| POST | `/api/grupos/:id/invitaciones` | Sí, admin | `{ "usuarioId": "<uuid>" }`. La persona ya debe ser amiga y no miembro | 201 `{ invitacion }` |
| GET | `/api/grupos/:id/invitaciones` | Sí, admin | | 200 `{ invitaciones }` |
| POST | `/api/grupos/invitaciones/:id/aceptar` | Sí, invitado | Crea la membresía | 200 |
| POST | `/api/grupos/invitaciones/:id/rechazar` | Sí, invitado | | 200 |

`POST /api/grupos/unirse` con el código sigue agregando al grupo de inmediato. La invitación entre amigos no da membresía hasta que se acepta.

"Admin" quiere decir admin del grupo o administrador general. El código de invitación solo lo ven los admins. Un grupo siempre conserva al menos un admin, y si el último admin sale, la base nombra admin al integrante más antiguo.

Al salir de un grupo, la persona abandona todos los retos activos de ese grupo. Si alguno de esos retos no permite abandonarlo, responde 409 con la lista de retos y no la deja salir. Cuando un admin quita a alguien, esa persona queda fuera de los retos del grupo y se conserva su historial. Si un grupo se queda sin miembros, el servidor lo borra solo después de 7 días.

### Retos (hábitos)

Las reglas de cada reto (frecuencia, puntos, castigos, permisos) las valida el paquete `@steply/database`. Las fechas van en formato `AAAA-MM-DD`.

| Método | Ruta | Token | Cuerpo de ejemplo | Respuesta |
|---|---|---|---|---|
| POST | `/api/retos` | Sí | ver ejemplo abajo | 201 `{ reto }` |
| GET | `/api/retos` | Sí | `?tipo=PERSONAL\|GRUPAL\|TODOS` y `?terminados=true` | 200 `{ retos }` |
| GET | `/api/retos/:id` | Sí | | 200 `{ reto }` |
| PATCH | `/api/retos/:id` | Sí, creador o admin | Los campos a cambiar, por ejemplo `{ "meta": "20 páginas" }` | 200 `{ reto }` |
| DELETE | `/api/retos/:id` | Sí, creador o admin | Borra el reto con todo su historial | 204 |
| POST | `/api/retos/:id/cancelar` | Sí, creador o admin | Lo detiene sin borrar el historial | 200 `{ reto }` |
| POST | `/api/retos/:id/participantes` | Sí, creador o admin | `{ "usuarioIds": ["<uuid>"] }` | 200 `{ participantes }` |
| DELETE | `/api/retos/:id/participantes/:usuarioId` | Sí, creador o admin | | 204 |
| POST | `/api/retos/:id/abandonar` | Sí | | 200 `{ participante }` |
| POST | `/api/retos/:id/pausa` | Sí | `{ "hasta": "2026-12-01", "motivo": "viaje" }` (opcional) | 200 `{ participante }` |
| DELETE | `/api/retos/:id/pausa` | Sí | Reanuda | 200 `{ participante }` |
| GET | `/api/retos/:id/ranking` | Sí | | 200 `{ ranking }` |
| GET | `/api/retos/:id/castigos` | Sí | `?pendientes=true` | 200 `{ castigos }` |

Ejemplo para crear un reto grupal. Para uno personal se usa `"tipo": "PERSONAL"` y se quitan `grupoId` y `participantes`.

```json
{
  "tipo": "GRUPAL",
  "grupoId": "<uuid>",
  "nombre": "Caminar",
  "frecuencia": "DIARIA",
  "fechaInicio": "2026-11-22",
  "requiereEvidencia": true,
  "requiereAprobacion": true,
  "participantes": ["<uuid>"],
  "castigo": { "descripcion": "Traer café", "periodo": "SEMANAL" }
}
```

`frecuencia` puede ser `DIARIA`, `SEMANAL` (con `vecesPorSemana`) o `DIAS_ESPECIFICOS` (con `diasSemana`, del 1 lunes al 7 domingo). Si se omite `participantes`, participa todo el grupo.

### Registro diario y evidencias

| Método | Ruta | Token | Cuerpo de ejemplo | Respuesta |
|---|---|---|---|---|
| POST | `/api/retos/:id/registros` | Sí | JSON `{ "cumplido": true, "nota": "listo", "fecha": "2026-11-22" }` o `multipart/form-data` con `cumplido`, `nota`, `fecha` y hasta 5 fotos en el campo `fotos` | 201 `{ registro, participante, puntosRegistro }` |
| GET | `/api/retos/:id/registros` | Sí | `?usuarioId=`, `?desde=`, `?hasta=` | 200 `{ historial }` |
| GET | `/api/hoy` | Sí | | 200 `{ hoy }` con el estado de cada reto para hoy |
| GET | `/api/calendario?anio=2026&mes=11` | Sí | `?retoId=` opcional | 200 `{ calendario }` |
| GET | `/api/pendientes` | Sí | Registros que el usuario puede aprobar. `?grupoId=` o `?retoId=` | 200 `{ pendientes }` |
| POST | `/api/registros/:id/revision` | Sí, creador o admin | `{ "aprobar": false, "motivo": "La foto no se ve" }` | 200 `{ registro, participante, puntosRegistro }` |

Las fotos solo se aceptan si `cumplido` es true. Cada foto puede pesar hasta 5 MB y debe ser JPG, PNG, WEBP o HEIC. Si se registra otra vez el mismo día, se actualiza el registro de ese día.

### Puntos e insignias

| Método | Ruta | Token | Cuerpo de ejemplo | Respuesta |
|---|---|---|---|---|
| GET | `/api/resumen` | Sí | | 200 `{ resumen }` con puntos, rachas, grupos e insignias |
| GET | `/api/movimientos` | Sí | `?retoId=`, `?limite=`, `?cursor=` | 200 `{ movimientos }` |
| POST | `/api/castigos/:id/saldar` | Sí, creador o admin | | 200 `{ castigo }` |
| GET | `/api/insignias` | Sí | | 200 `{ insignias }` con `obtenida` y `obtenidaEn` |

### Cierre diario

El servidor ejecuta el cierre diario al arrancar y después cada hora. El cierre marca los días no cumplidos, aplica los castigos semanales y termina los retos que ya pasaron su fecha de fin. Se puede repetir sin problema.

Reglas. El correo y el nombre de usuario se guardan en minúsculas y no se pueden repetir (409). La contraseña debe tener al menos 8 caracteres. Si el correo, el usuario o la contraseña están mal, el login responde 401 con el mismo mensaje. Una cuenta suspendida recibe 403. Cambiar la contraseña invalida los tokens anteriores.

Todos los errores tienen esta forma.

```json
{ "codigo": "VALIDACION", "mensaje": "texto para el usuario", "detalles": {} }
```

| Código | Status | Cuándo |
|---|---|---|
| `VALIDACION` | 400 | Faltan datos o están mal |
| `NO_AUTENTICADO` | 401 | Sin token, token inválido o vencido, login incorrecto |
| `SIN_PERMISO` | 403 | No tiene permiso o la cuenta está suspendida |
| `NO_ENCONTRADO` | 404 | No existe el dato o la ruta |
| `CONFLICTO` | 409 | Dato repetido, por ejemplo un correo ya registrado |
| `ERROR_INTERNO` | 500 | Error inesperado del servidor |


## Probar la API con Postman

La colección está en `backend/postman/Steply.postman_collection.json`. Se importa en Postman (o Thunder Client) con Import.

1. Encender la base y el backend (`docker compose up -d` y `npm run dev`).
2. Correr primero "Autenticación / Iniciar sesión". Guarda el token solo y las demás peticiones lo usan.
3. Para entrar con otro usuario del seed se cambian las variables `correo` y `password` de la colección.
4. Las peticiones que crean algo (grupo, reto, solicitud, registro) guardan su id en las variables, así que conviene seguir el orden de cada carpeta.
5. En las peticiones con fotos hay que elegir el archivo en la pestaña Body.

## Despliegue

El backend y el paquete de la base se despliegan juntos desde la raíz del repositorio, porque el backend usa `@steply/database`.

1. Crear una base PostgreSQL gratuita (Neon, Supabase, Render o Railway) y copiar su `DATABASE_URL`. En Neon y Supabase se agrega `?sslmode=require` al final si no lo trae.
2. Crear el servicio web en el hosting (por ejemplo Render o Railway) apuntando a este repositorio, con estos comandos.

| Paso | Comando |
|---|---|
| Instalar | `npm ci` |
| Migraciones | `npm run db:deploy` |
| Arrancar | `npm start --workspace @steply/backend` |

3. Poner las variables de entorno en el panel del hosting, nunca en el repositorio.

| Variable | Valor |
|---|---|
| `DATABASE_URL` | La de la base del paso 1 |
| `JWT_SECRET` | Una clave larga y aleatoria, distinta a la de desarrollo |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Las de la cuenta de Cloudinary. Sin ellas las fotos se guardan en memoria y se pierden al reiniciar el proceso. También se acepta `CLOUDINARY_URL` |
| `NODE_ENV` | `production` |

## Limitaciones conocidas

- Sin credenciales de Cloudinary, la foto de perfil y la evidencia se pueden ver mientras el backend sigue encendido. Después de reiniciarlo, la referencia queda en PostgreSQL y la imagen ya no se puede mostrar. La interfaz oculta la imagen rota. No se guardan fotos en Base64.
- Los interruptores de notificaciones guardan una preferencia en el dispositivo. Steply no envía correos ni notificaciones push.
- Cambiar la contraseña emite un token nuevo e invalida los anteriores. No hay correo de restablecimiento.
- El correo de la cuenta se muestra en ajustes y no se puede cambiar desde la aplicación.
- Los usuarios del seed solo existen después de `npm run db:seed`. La contraseña de esos usuarios es `Steply123!`.

El hosting pone el `PORT` solo. Para cargar los datos de prueba en la base desplegada, una sola vez, se corre `npm run db:seed` con la `DATABASE_URL` de esa base.
