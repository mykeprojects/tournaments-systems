# Frontend: Tournament System

## Requisitos

- Node.js LTS compatible with Vite 8.
- npm (incluido con Node.js).

## Instalacion y ejecucion

1. Copia `.env.example` como `.env.local`.
2. Completa las variables `VITE_FIREBASE_*` con la configuracion de tu
   aplicacion web de Firebase.
3. Instala las dependencias con `npm ci`.
4. Inicia el frontend con `npm run dev`.

Vite sirve la aplicacion en `http://localhost:5173`. El cliente HTTP se conecta
por defecto al backend Spring Boot en `http://localhost:8080`; puedes cambiarlo
con `VITE_API_URL`. No pongas secretos de servidor en variables `VITE_*`, ya
que se incluyen en el cliente web.

## Backend y autenticacion

La estrategia configurada por defecto usa una cookie de sesion HttpOnly. El
frontend espera que el backend implemente `POST /auth/firebase`,
`GET /auth/session` y `POST /auth/logout`; el inicio de sesion envia el ID token
de Firebase y espera una respuesta con la forma `{ "user": { ... } }`.
`apiClient` esta en `src/infrastructure/http/apiClient.ts` y envia cookies con
credenciales.

El repositorio backend actualmente es un esqueleto sin esos controladores. La
configuracion de CORS permite el origen local de Vite para que la comunicacion
entre proyectos pueda habilitarse al implementar sus endpoints. El backend
debe verificar los tokens con Firebase Admin SDK y aplicar la autorizacion en
el servidor; los guards del frontend solo controlan la navegacion.
