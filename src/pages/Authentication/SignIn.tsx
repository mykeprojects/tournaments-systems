import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const CURRENT_YEAR = new Date().getFullYear();

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const {
    loginWithCredentials,
    loginWithGoogle,
    loginWithGitHub,
    loginWithMicrosoft,
  } = useAuth();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    setLoginError(null);
    setIsSubmitting(true);
    try {
      await loginWithCredentials(credentials.email, credentials.password);
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("Error al iniciar sesión", error);
      setLoginError(
        error?.message || "Credenciales inválidas o error al iniciar sesión."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (
    provider: "google" | "github" | "microsoft"
  ) => {
    setLoginError(null);
    setIsSubmitting(true);
    try {
      if (provider === "google") await loginWithGoogle();
      if (provider === "github") await loginWithGitHub();
      if (provider === "microsoft") await loginWithMicrosoft();
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error(`Error en login con ${provider}:`, error);
      setLoginError(
        error?.message || `Error al iniciar sesión con ${provider}.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

  const socialButtonClass =
    "flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Panel visual deportivo */}
        <section className="relative isolate flex min-h-[340px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#173d27] via-[#102a1d] to-[#07110d] px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(190,242,100,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(190,242,100,.15) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
          <div className="absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl sm:h-96 sm:w-96" />

          <a href="/" className="flex items-center gap-3 self-start">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-400 shadow-lg shadow-lime-950/40">
              <svg
                aria-hidden="true"
                className="h-6 w-6 text-[#07110d]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="12 6 15 8.5 14 12 10 12 9 8.5 12 6" />
                <path d="M12 6V2" />
                <path d="M15 8.5 19 6.5" />
                <path d="M14 12 17.5 15.5" />
                <path d="M10 12 6.5 15.5" />
                <path d="M9 8.5 5 6.5" />
              </svg>
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight">
                Sports System<span className="text-lime-400">+</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
                Vive el deporte
              </span>
            </span>
          </a>

          <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center py-10 text-center lg:py-0">
            <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-lime-300/10 sm:h-80 sm:w-80" />
            <div className="absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-lime-300/10 sm:h-[26rem] sm:w-[26rem]" />

            <div className="mb-7 flex h-44 w-44 items-center justify-center rounded-full border border-lime-400/20 bg-lime-400/5 shadow-2xl shadow-black/40 backdrop-blur-sm sm:h-56 sm:w-56">
              <svg
                aria-hidden="true"
                className="h-24 w-24 text-lime-400 drop-shadow-[0_10px_20px_rgba(163,230,53,0.35)] sm:h-28 sm:w-28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="12 6 15 8.5 14 12 10 12 9 8.5 12 6" />
                <path d="M12 6V2" />
                <path d="M15 8.5 19 6.5" />
                <path d="M14 12 17.5 15.5" />
                <path d="M10 12 6.5 15.5" />
                <path d="M9 8.5 5 6.5" />
              </svg>
            </div>

            <span className="mb-4 rounded-full border border-lime-300/30 bg-lime-300/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-lime-300">
              Tu pasión, tu equipo
            </span>
            <h1 className="max-w-lg text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              El juego se vive
              <span className="block text-lime-400">aquí.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
              Entra a tu espacio deportivo y prepárate para seguir cada jugada,
              cada reto y cada victoria.
            </p>

            <div className="mt-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.8)]" />
              La emoción empieza contigo
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 lg:text-left">
            © {CURRENT_YEAR} Sports System+. Hecho para quienes viven el deporte.
          </p>
        </section>

        {/* Formulario */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <span className="text-sm font-black tracking-wide">
                Sports System<span className="text-lime-400">+</span>
              </span>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-lime-400">
                Bienvenido de nuevo
              </p>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Entra en juego
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Inicia sesión para continuar en tu comunidad deportiva.
              </p>
            </div>

            {loginError && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {loginError}
              </div>
            )}

            <Formik
              initialValues={{ email: "", password: "" }}
              validationSchema={Yup.object({
                email: Yup.string()
                  .email("Ingresa un correo válido")
                  .required("El correo es obligatorio"),
                password: Yup.string().required("La contraseña es obligatoria"),
              })}
              onSubmit={(values) => void handleLogin(values)}
            >
              {({ handleSubmit }) => (
                <Form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-slate-200"
                    >
                      Correo electrónico
                    </label>
                    <Field
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      className={inputClass}
                    />
                    <ErrorMessage
                      name="email"
                      component="p"
                      className="mt-2 text-xs text-red-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-slate-200"
                      >
                        Contraseña
                      </label>
                    </div>
                    <Field
                      id="password"
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      placeholder="Ingresa tu contraseña"
                      className={inputClass}
                    />
                    <ErrorMessage
                      name="password"
                      component="p"
                      className="mt-2 text-xs text-red-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3.5 text-sm font-extrabold text-[#102016] shadow-lg shadow-lime-950/20 transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 focus:ring-offset-[#07110d] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Entrando..." : "Iniciar sesión"}
                    {!isSubmitting && (
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </button>
                </Form>
              )}
            </Formik>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs font-medium text-slate-500">
                O continúa con
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSocialLogin("google")}
                className={socialButtonClass}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 48 48"
                  className="h-5 w-5 shrink-0"
                >
                  <path
                    fill="#4285F4"
                    d="M43.6 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.9 6-15.6Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.4A20 20 0 0 0 24 44Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M12.8 27.6a12 12 0 0 1 0-7.2V15H5.9a20 20 0 0 0 0 18l6.9-5.4Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M24 12.2c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.9 15l6.9 5.4c1.6-4.7 6-8.2 11.2-8.2Z"
                  />
                </svg>
                Continuar con Google
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSocialLogin("github")}
                className={socialButtonClass}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.08c-3.1.67-3.75-1.32-3.75-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.7 1.15 1.7 1.15.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.7-1.49-2.47-.28-5.07-1.24-5.07-5.5 0-1.21.43-2.2 1.15-2.98-.12-.28-.5-1.41.11-2.94 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.66.12 2.94.71.78 1.14 1.77 1.14 2.98 0 4.27-2.61 5.21-5.09 5.49.4.35.75 1.02.75 2.06v3.06c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
                </svg>
                Continuar con GitHub
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleSocialLogin("microsoft")}
                className={socialButtonClass}
              >
                <span className="grid h-5 w-5 grid-cols-2 gap-0.5">
                  <span className="bg-[#f25022]" />
                  <span className="bg-[#7fba00]" />
                  <span className="bg-[#00a4ef]" />
                  <span className="bg-[#ffb900]" />
                </span>
                Continuar con Microsoft
              </button>
            </div>

            <p className="mt-8 text-center text-xs leading-5 text-slate-500">
              Al continuar, accedes a tu cuenta de Sports System+ y aceptas las
              condiciones de uso de la plataforma.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default SignIn;