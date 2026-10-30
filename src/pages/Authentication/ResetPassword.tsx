import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { resetPassword, verifyPasswordRecovery } from "../../services/passwordRecoveryService";
import { routePaths } from "../../routes/routePaths";

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";
const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])\S{8,72}$/;

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? "";

  if (!email) {
    return <NavigateToRecovery />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110d] px-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1b14] p-7 shadow-2xl sm:p-10">
        <p className="text-sm font-black tracking-wide">Sports System<span className="text-lime-400">+</span></p>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.25em] text-lime-400">Código de recuperación</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Verifica tu correo</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Ingresa el código recibido en {email}.</p>

        <Formik
          initialValues={{ code: "" }}
          validationSchema={Yup.object({
            code: Yup.string().matches(/^\d{6}$/, "El código debe tener 6 dígitos").required("El código es obligatorio"),
          })}
          onSubmit={async ({ code }, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              const response = await verifyPasswordRecovery({ email, code });
              navigate(routePaths.resetPassword, { state: { resetToken: response.resetToken } });
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "El código no es válido o ha expirado.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status }) => (
            <Form className="mt-8 space-y-5">
              {status && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{status}</p>}
              <div>
                <label htmlFor="code" className="text-sm font-semibold text-slate-200">Código de 6 dígitos</label>
                <Field id="code" name="code" inputMode="numeric" maxLength={6} className={inputClass} autoComplete="one-time-code" />
                <ErrorMessage name="code" component="p" className="mt-2 text-xs text-red-400" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-lime-400 px-5 py-3.5 text-sm font-extrabold text-[#102016] transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Verificando..." : "Confirmar código"}
              </button>
            </Form>
          )}
        </Formik>
      </section>
    </main>
  );
};

const SetNewPassword = () => {
  const navigate = useNavigate();
  const resetToken = (useLocation().state as { resetToken?: string } | null)?.resetToken;
  if (!resetToken) return <NavigateToRecovery />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07110d] px-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0d1b14] p-7 shadow-2xl sm:p-10">
        <p className="text-sm font-black tracking-wide">Sports System<span className="text-lime-400">+</span></p>
        <h1 className="mt-10 text-3xl font-black tracking-tight">Crea una nueva contraseña</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Usa una contraseña segura para proteger tu cuenta.</p>
        <Formik
          initialValues={{ password: "", confirmPassword: "" }}
          validationSchema={Yup.object({
            password: Yup.string().matches(passwordRule, "Debe tener mayúscula, minúscula, número, carácter especial y no contener espacios").required("La contraseña es obligatoria"),
            confirmPassword: Yup.string().oneOf([Yup.ref("password")], "Las contraseñas no coinciden").required("Confirma tu contraseña"),
          })}
          onSubmit={async ({ password }, { setSubmitting, setStatus }) => {
            setStatus(null);
            try {
              await resetPassword({ resetToken, password });
              navigate(routePaths.signIn, { replace: true, state: { recoveryCompleted: true } });
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "No fue posible cambiar la contraseña.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status }) => (
            <Form className="mt-8 space-y-5">
              {status && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{status}</p>}
              {(["password", "confirmPassword"] as const).map((name) => (
                <div key={name}>
                  <label htmlFor={name} className="text-sm font-semibold text-slate-200">{name === "password" ? "Nueva contraseña" : "Confirmar contraseña"}</label>
                  <Field id={name} name={name} type="password" className={inputClass} autoComplete="new-password" />
                  <ErrorMessage name={name} component="p" className="mt-2 text-xs text-red-400" />
                </div>
              ))}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-lime-400 px-5 py-3.5 text-sm font-extrabold text-[#102016] transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </Form>
          )}
        </Formik>
      </section>
    </main>
  );
};

const NavigateToRecovery = () => <Navigate to={routePaths.forgotPassword} replace />;

export { SetNewPassword };
export default ResetPassword;
