# React + TypeScript + Vite

## Autenticacion

La autenticacion usa Firebase Authentication en el cliente y una sesion
HttpOnly emitida por Spring Boot. Activa en Firebase los proveedores Google,
GitHub, Microsoft y correo/contraseña, y configura sus dominios autorizados.

1. Copia `.env.example` a `.env.local`.
2. Completa las variables `VITE_FIREBASE_*` desde la configuracion de tu
   aplicacion web de Firebase.
3. Define `VITE_API_URL` y, si es necesario, cambia
   `VITE_AUTH_ENDPOINT` (por defecto `/auth/firebase`).
4. El endpoint de Spring Boot debe verificar el `Authorization: Bearer
   <firebase-id-token>` con Firebase Admin SDK, crear la cookie de sesion
   `HttpOnly` y responder `{ "user": { ... } }`.

El frontend nunca recibe credenciales de proveedores sociales ni tokens de
sesion. Firebase realiza el login una sola vez; Spring Boot confirma el ID
token y devuelve una cookie `HttpOnly`. Todas las peticiones del backend deben
realizarse mediante `apiClient` desde `src/services/apiClient.ts`, que usa
`withCredentials: true`. Si el backend utiliza protección CSRF, debe emitir la
cookie `XSRF-TOKEN`; Axios la enviará como `X-XSRF-TOKEN`.

La restauración usa `GET /auth/session`. El cierre usa `POST /auth/logout`.
Las rutas `/dashboard` y `/admin` están protegidas. `/admin` requiere el rol
`ADMIN`; un usuario sin permisos se redirige a `/forbidden`. Estos guards son
solo UX: Spring Boot debe aplicar siempre la autorización real.

### Estado de sesión con Redux

La sesión se administra en el slice `src/store/authSlice.ts` y se registra
mediante `Provider` en `src/main.tsx`. Para leerla desde cualquier componente:

```tsx
import { useAppSelector } from "../store/hooks";

const { user, token, loading } = useAppSelector((state) => state.auth);
```

Las acciones de login/logout continúan expuestas por `useAuth`, pero el estado
ya no se duplica en React local:

```tsx
const { user, logout } = useAuth();
```

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
