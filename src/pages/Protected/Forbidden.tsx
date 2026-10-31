import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { routePaths } from "../../routes/routePaths";

const Forbidden = () => (
  <ForbiddenContent />
);

const ForbiddenContent = () => {
  const { user, permissionCheckError, logout } = useAuth();

  return (
  <main className="flex min-h-screen items-center justify-center bg-[#07110d] px-5 text-white">
    <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0b1711] p-8 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-lime-400">
        Sports System+
      </p>
      <h1 className="mt-4 text-3xl font-black">Acceso no permitido</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        {permissionCheckError
          ? `No fue posible consultar tus permisos: ${permissionCheckError}`
          : user
            ? "Tu cuenta no tiene los permisos necesarios para consultar esta sección."
            : "No tienes permisos para consultar esta sección."}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          to={routePaths.signIn}
          onClick={() => void logout()}
          className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-bold text-[#102016] transition hover:bg-lime-300"
        >
          Cerrar sesión
        </Link>
      </div>
    </section>
  </main>
  );
};

export default Forbidden;
