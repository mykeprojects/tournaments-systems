import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordRecovery } from "../../services/passwordRecoveryService";
import { routePaths } from "../../routes/routePaths";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

const ForgotPassword = () => {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110d] px-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1b14] p-7 shadow-2xl sm:p-10">
        <p className="text-sm font-black tracking-wide">
          Sports System<span className="text-lime-400">+</span>
        </p>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.25em] text-lime-400">
          Recuperación segura
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">¿Olvidaste tu contraseña?</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Te enviaremos un código temporal al correo de tu cuenta.
        </p>

        <Formik
          initialValues={{ email: "" }}
          validationSchema={Yup.object({
            email: Yup.string().email("El email no tiene un formato válido").required("El email es obligatorio"),
          })}
          onSubmit={async ({ email }, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              await requestPasswordRecovery({ email });
              navigate(routePaths.recoverVerify, { state: { email } });
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "No fue posible solicitar la recuperación.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status }) => (
            <Form className="mt-8 space-y-5">
              {status && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{status}</p>}
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-slate-200">Correo electrónico</label>
                <Field id="email" name="email" type="email" className={inputClass} autoComplete="email" />
                <ErrorMessage name="email" component="p" className="mt-2 text-xs text-red-400" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-lime-400 px-5 py-3.5 text-sm font-extrabold text-[#102016] transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Enviando..." : "Enviar código"}
              </button>
            </Form>
          )}
        </Formik>

        <Link to={routePaths.signIn} className="mt-6 block text-center text-sm font-bold text-lime-400 hover:text-lime-300">
          Volver a iniciar sesión
        </Link>
      </section>
    </main>
  );
};

export default ForgotPassword;
