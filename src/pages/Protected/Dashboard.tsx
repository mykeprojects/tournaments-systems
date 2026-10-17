import { useAuth } from "../../hooks/useAuth";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-[#07110d] p-8 text-white">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
        <h1 className="text-3xl font-black text-lime-400">Panel principal</h1>
        
        <div className="mt-4 space-y-2 text-slate-300">
          <p>
            <span className="font-semibold text-slate-400">Bienvenido:</span>{" "}
            {user?.email}
          </p>
          <p>
            <span className="font-semibold text-slate-400">Rol:</span>{" "}
            <span className="inline-block rounded-md bg-lime-400/10 px-2 py-0.5 text-xs font-bold text-lime-300">
              {user?.role}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 border border-red-500/20 transition hover:bg-red-500/20"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
};

export default Dashboard;