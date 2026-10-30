import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { register } from "../../services/authService";
import FeedbackModal from "../../components/FeedbackModal";
import { routePaths } from "../../routes/routePaths";

const CURRENT_YEAR = new Date().getFullYear();

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Panel deportivo */}
        <section className="relative isolate flex min-h-[300px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#173d27] via-[#102a1d] to-[#07110d] px-6 py-8 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(190,242,100,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(190,242,100,.15)_1px,transparent_1px)] bg-[length:42px_42px] opacity-20"
          />
          <div className="absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl sm:h-96 sm:w-96" />

          <Link to="/" className="flex items-center gap-3 self-start">
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
          </Link>

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
              Únete al equipo
            </span>
            <h1 className="max-w-lg text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Tu próxima
              <span className="block text-lime-400">gran jugada.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
              Crea tu cuenta y forma parte de una comunidad que vive cada
              partido, cada torneo y cada victoria.
            </p>
          </div>

          <p className="text-center text-xs text-slate-500 lg:text-left">
            © {CURRENT_YEAR} Sports System+. Hecho para quienes viven el deporte.
          </p>
        </section>

        {/* Formulario de registro */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <span className="text-sm font-black tracking-wide">
                Sports System<span className="text-lime-400">+</span>
              </span>
            </div>

            <div className="mb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-lime-400">
                Empieza gratis
              </p>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Crea tu cuenta
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Regístrate para entrar en juego con Sports System+.
              </p>
            </div>

            <Formik
              initialValues={{
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
              }}
              validationSchema={Yup.object({
                name: Yup.string()
                  .trim()
                  .min(2, "El nombre debe tener entre 2 y 100 caracteres")
                  .max(100, "El nombre debe tener entre 2 y 100 caracteres")
                  .required("El nombre es obligatorio"),
                email: Yup.string()
                  .email("El email no tiene un formato válido")
                  .required("El email es obligatorio"),
                password: Yup.string()
                  .matches(
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])\S{8,72}$/,
                    "Debe tener mayúscula, minúscula, número, carácter especial y no contener espacios"
                  )
                  .required("La contraseña es obligatoria"),
                confirmPassword: Yup.string()
                  .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
                  .required("Confirma tu contraseña"),
              })}
              onSubmit={async ({ name, email, password }, { setSubmitting, resetForm }) => {
                try {
                  await register({ name, email, password });
                  resetForm();
                  setFeedback({
                    variant: "success",
                    message: "Tu cuenta fue creada correctamente. Ya puedes iniciar sesión.",
                  });
                } catch (error: unknown) {
                  setFeedback({
                    variant: "error",
                    message:
                      error instanceof Error
                        ? error.message
                        : "No fue posible crear la cuenta.",
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-slate-200"
                >
                  Nombre completo
                </label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre completo"
                  className={inputClass}
                />
                <ErrorMessage name="name" component="p" className="mt-2 text-xs text-red-300" />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-200"
                >
                  Correo electrónico
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  className={inputClass}
                />
                <ErrorMessage name="email" component="p" className="mt-2 text-xs text-red-300" />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-200"
                >
                  Contraseña
                </label>
                <Field
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Crea una contraseña"
                  className={inputClass}
                />
                <ErrorMessage name="password" component="p" className="mt-2 text-xs text-red-300" />
                <p className="mt-2 text-xs text-slate-500">
                  Usa una contraseña segura que puedas recordar.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-slate-200"
                >
                  Confirmar contraseña
                </label>
                <Field
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repite tu contraseña"
                  className={inputClass}
                />
                <ErrorMessage name="confirmPassword" component="p" className="mt-2 text-xs text-red-300" />
              </div>

              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3.5 text-sm font-extrabold text-[#102016] shadow-lg shadow-lime-950/20 transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-300 focus:ring-offset-2 focus:ring-offset-[#07110d]"
              >
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
                </Form>
              )}
            </Formik>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs font-medium text-slate-500">
                ¿Ya tienes cuenta?
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <Link
              to="/auth/signin"
              className="flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-lime-400/60 hover:bg-slate-800"
            >
              Iniciar sesión
            </Link>

            <p className="mt-8 text-center text-xs leading-5 text-slate-500">
              Al crear una cuenta, aceptas las condiciones de uso de la
              plataforma Sports System+.
            </p>
          </div>
        </section>
      </div>
      {feedback && (
        <FeedbackModal
          variant={feedback.variant}
          title={feedback.variant === "success" ? "Registro exitoso" : "No fue posible registrarte"}
          message={feedback.message}
          onClose={() => setFeedback(null)}
          action={
            feedback.variant === "success" ? (
              <button
                type="button"
                onClick={() => navigate(routePaths.signIn)}
                className="rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-extrabold text-[#102016] transition hover:bg-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-300/60"
              >
                Ir a iniciar sesión
              </button>
            ) : undefined
          }
        />
      )}
    </main>
  );
};

export default SignUp;