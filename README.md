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

## Comandos

```powershell
npm run dev
npm run lint
npm run build
npm test
```
