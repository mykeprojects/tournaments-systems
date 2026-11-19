# Sports System+ — Frontend

Frontend en React, TypeScript y Vite para el módulo de seguridad del sistema
de torneos.

## Desarrollo local

1. Inicia el backend Spring Boot. Su configuración local usa el puerto `8181`.
2. Define en `.env.local` la URL base del backend:

   ```dotenv
   VITE_API_BASE_URL=http://localhost:8181
   ```

   La URL debe ser el origen del servidor, sin `/api` al final. Si no se
   configura, el frontend usa `http://localhost:8181`.
3. Instala dependencias con `npm install` y ejecuta `npm run dev`.

El backend debe incluir el origen del frontend en
`security.cors.allowed-origin-patterns`. Para Vite local usa
`http://localhost:5173`; puedes configurar otros orígenes con
`SECURITY_CORS_ALLOWED_ORIGINS` en el backend.

## Acceso y gestión de usuarios

- El inicio de sesión envía correo y contraseña a `POST /api/auth/login`.
- El JWT y su fecha de expiración se guardan en `sessionStorage` y se envían
  como `Authorization: Bearer ...` a las rutas protegidas. La sesión local se
  elimina al cerrar sesión o al expirar el token.
- El panel (`/dashboard` o `/admin`) consulta `GET /api/users` y crea usuarios
  con `POST /api/users`. El acceso al panel se limita en el frontend a cuentas
  con el rol `ADMIN`, consultado en `GET /api/user-roles/users/{userId}`.
- En la tabla de usuarios, un administrador puede asignar roles con
  `POST /api/user-roles` y eliminar usuarios con `DELETE /api/users/{id}`.
  Los roles y asignaciones se cargan desde `GET /api/roles` y
  `GET /api/user-roles`.
- El formulario de creación valida nombre, correo y las reglas de contraseña
  esperadas por el backend. La contraseña nunca se envía a un servicio externo;
  el backend la almacena con BCrypt.
- Los permisos reales siguen siendo responsabilidad del backend. Si el usuario
  autenticado no tiene permiso para listar o crear usuarios, la API rechazará
  la operación y el panel mostrará el error. El rol mostrado por el frontend
  solo controla la experiencia de usuario: el backend debe asignar los
  permisos de cada operación exclusivamente a los roles autorizados.
- Las cuentas iniciales, incluido el administrador, se pueden insertar con el
  seeder o manualmente en la base de datos. No conectes el navegador
  directamente a MySQL.

La integración de Firebase/OAuth se mantiene fuera de este flujo de trabajo y
se incorporará por separado.

## Apuestas (HU-GC-11)

- El frontend del servicio deportivo usa `VITE_SPORT_API_URL` (por defecto
  `http://localhost:3000`) y envía el JWT de la sesión a `ms_sport_system`.
- El rol `AFICIONADO`/`HINCHA` accede a `/apuestas`: partidos disponibles,
  métodos de pago propios, registro, historial y solicitud de cancelación.
- El rol `ADMINISTRADOR DEPORTIVO` accede a `/gestion/apuestas` para consultar
  apuestas por partido. Las rutas de gestión deportiva existentes también
  quedan limitadas a este rol.
- Los roles controlan navegación y vistas en el frontend; las reglas sobre
  propiedad del método de pago, disponibilidad, límites, cancelación y
  liquidación siguen siendo responsabilidad del backend.

## Resultados y anotaciones (HU-GC-07)

- El rol `ADMINISTRADOR DEPORTIVO` gestiona partidos desde `/gestion/partidos`.
- La página consulta los partidos y registra el resultado oficial; los resultados de partidos finalizados o cancelados no se pueden volver a modificar, según las reglas de `ms_sport_system`.
- Las anotaciones se pueden consultar, crear, modificar y eliminar. Para crear o modificar una anotación, el selector de jugador se limita a integrantes activos de los equipos participantes; el backend vuelve a validar esa relación.
- En partidos cancelados no se pueden crear ni modificar anotaciones. Eliminar una anotación no elimina el jugador ni el partido.
- La comunicación se realiza con `VITE_SPORT_API_URL` y el JWT de la sesión, mediante el cliente HTTP del servicio deportivo.
- `ms_sport_system` valida cada endpoint con los permisos dinámicos de `ms_security_tournament`. Deben existir y estar asignados al rol deportivo `GET /matches`, `PATCH /matches/{id}/result`, `GET`/`POST /matches/{matchId}/annotations`, `PATCH`/`DELETE /matches/{matchId}/annotations/{annotationId}` y `GET /players`. El seeder actual de seguridad no registra estos permisos. El guard de rol del frontend no sustituye esta autorización del backend.

## Seguimiento deportivo (HU-GC-09)

- `ADMINISTRADOR DEPORTIVO` y `AFICIONADO`/`HINCHA` acceden a `/seguimiento`; el administrador puede iniciar/finalizar la simulación y el hincha solo observa.
- La pantalla consulta el tablero REST y se suscribe con Socket.IO al namespace `/tracking`, se une a la sala `match:{id}` y procesa `tracking:update`. El servidor simula posiciones automáticamente al iniciar; no hay una operación de pausa.
- La cancha se dibuja según el deporte y las dimensiones reales del tablero, y los jugadores/equipo/ pelota usan los participantes, colores y coordenadas devueltos por el backend.
- `ms_sport_system` necesita asignar `GET /matches` y `GET /matches/{matchId}/tracking` a ambos roles. Solo el administrador deportivo debe tener `POST /matches/{matchId}/tracking/start` y `POST /matches/{matchId}/tracking/stop`. El seeder de `ms_security_tournament` no los registra.
- El gateway WebSocket no valida explícitamente el JWT ni el permiso al unirse a una sala; la protección de rutas HTTP y los guards del frontend no sustituyen autorización para el canal WebSocket.

## Comandos

```powershell
npm run dev
npm run lint
npm run build
npm test
```
