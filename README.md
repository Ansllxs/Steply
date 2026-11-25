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

En desarrollo esas tres pueden quedar vacías. Las fotos se ven solo hasta que se reinicia el backend. Para conservarlas hay que crear una cuenta de Cloudinary y pegar aquí sus valores, o usar `CLOUDINARY_URL`. No invente credenciales. El archivo `frontend/.env` es opcional. Si existe, `VITE_API_BASE_URL` cambia la dirección del backend. Vacío, el desarrollo usa `http://localhost:3000`.

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
| `cd backend && npm test` | Revisa la configuración de producción, el límite de intentos y la URL del API |
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

El código queda listo para configurarse. Este repositorio no crea cuentas, no compra servicios y no despliega nada por sí solo.

El backend y el paquete de la base se despliegan juntos desde la raíz, porque el backend usa `@steply/database`. El frontend se compila aparte y se publica como sitio estático. El hosting del frontend debe devolver `index.html` en las rutas de la aplicación, para que recargar `/habits` o `/groups` no falle.

1. Crear una base PostgreSQL y copiar su `DATABASE_URL`. En Neon y Supabase se agrega `?sslmode=require` si la URL no lo trae.
2. Crear una cuenta de Cloudinary y copiar el nombre de la nube, la API key y el API secret. También sirve `CLOUDINARY_URL`.
3. Crear el servicio del backend apuntando a este repositorio.

| Paso | Comando |
|---|---|
| Instalar | `npm ci` |
| Migraciones | `npm run db:deploy` |
| Arrancar | `npm start --workspace @steply/backend` |

`npm run db:deploy` aplica las migraciones pendientes y no borra datos. No use `db:reset` ni `db:seed` en la base real. El seed crea cuentas de prueba.

4. Compilar el frontend con la dirección pública del backend.

```bash
cd frontend
VITE_API_BASE_URL=https://api.ejemplo.com npm run build
```

El resultado queda en `frontend/dist`. `VITE_API_URL` sigue funcionando con el mismo significado. Si el build de producción no tiene ninguna de las dos, la aplicación avisa que falta la dirección del servidor y no llama a `localhost`.

5. Poner las variables en el panel del hosting, nunca en el repositorio.

| Variable | Dónde | Valor |
|---|---|---|
| `DATABASE_URL` | Backend | URL de PostgreSQL |
| `JWT_SECRET` | Backend | Clave propia de al menos 32 caracteres, distinta a la de desarrollo |
| `NODE_ENV` | Backend | `production` |
| `PORT` | Backend | La que asigne el hosting. Si no se define, usa 3000 |
| `CORS_ORIGIN` | Backend | Origen público del frontend, por ejemplo `https://app.ejemplo.com`. Varios orígenes van separados por coma |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Backend | Credenciales de Cloudinary. También se acepta `CLOUDINARY_URL` |
| `VITE_API_BASE_URL` | Frontend, al compilar | Dirección pública del backend, sin `/api` al final |

En producción el servidor no arranca si falta la base, el secreto, el origen CORS o Cloudinary. Si las credenciales están incompletas, tampoco arranca. Una subida que el proveedor rechaza responde que la imagen no se guardó. El desarrollo, sin esas credenciales, sigue guardando las fotos en memoria solo mientras el proceso está encendido.

`GET /api/salud` responde si el proceso vive y dice si el almacenamiento es `cloudinary`, `memoria` o `no-disponible`. `GET /api/salud-bd` comprueba PostgreSQL. Esas rutas no muestran secretos.

Para apagar el proceso, el servidor espera a cerrar las conexiones al recibir SIGINT o SIGTERM.

### Copia de seguridad

La base de desarrollo vive en el volumen Docker `steply-datos`. `docker compose down` no lo borra. No ejecute `docker compose down -v` ni `npm run db:reset` si quiere conservar los datos.

Una copia de la base se saca con `pg_dump` usando la `DATABASE_URL` correspondiente y se restaura con `pg_restore` o `psql` en una base vacía. Después se corren las migraciones con `npm run db:deploy` solo si esa copia todavía no las tiene. Las fotos permanentes viven en Cloudinary, no dentro de PostgreSQL: la base guarda la URL y el `public_id`. Una copia de la base sin la cuenta de Cloudinary no recupera los archivos.

### Lista antes de publicar

- `NODE_ENV=production` y un `JWT_SECRET` propio.
- `CORS_ORIGIN` apunta al sitio real, no a `*`.
- Cloudinary configurado y `GET /api/salud` muestra `cloudinary`.
- El frontend se compiló con `VITE_API_BASE_URL`.
- Las migraciones se aplicaron con `db:deploy`.
- No se cargó el seed en la base pública.
- Recargar una ruta interna abre la aplicación.
- Subir una foto, reiniciar el backend y comprobar que la imagen sigue visible.

## Limitaciones conocidas

- Sin credenciales de Cloudinary, en desarrollo la foto de perfil y la evidencia se pueden ver mientras el backend sigue encendido. Después de reiniciarlo, la referencia queda en PostgreSQL y la imagen ya no se puede mostrar. La interfaz oculta la imagen rota. No se guardan fotos en Base64. Esta integración no se probó contra una cuenta real de Cloudinary porque no hay credenciales.
- Los interruptores de notificaciones guardan una preferencia en el dispositivo. Steply no envía correos ni notificaciones push.
- Cambiar la contraseña emite un token nuevo e invalida los anteriores. No hay correo de restablecimiento.
- El correo de la cuenta se muestra en ajustes y no se puede cambiar desde la aplicación.
- Los usuarios del seed solo existen después de `npm run db:seed`. La contraseña de esos usuarios es `Steply123!`.
- El límite de intentos de registro e inicio de sesión vive en la memoria de cada proceso. Si hay varias copias del backend, cada una cuenta por separado.

El hosting pone el `PORT` solo.
