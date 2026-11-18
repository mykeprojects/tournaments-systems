import { permissionAction } from "../../domain/authorization/permissionMatrix";
import { groupPermissionsByModule } from "../../domain/authorization/rolePermissions";
import type { RoleAuthorization } from "../../models/user";

type UserAuthorizationPanelProps = {
  roles: RoleAuthorization[] | undefined;
};

const UserAuthorizationPanel = ({ roles }: UserAuthorizationPanelProps) => {
  if (!roles || roles.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-400">
        Este usuario aún no tiene roles asignados.
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {roles.map((role) => {
        const modules = groupPermissionsByModule(role.permissions);

        return (
          <article
            key={role.id}
            className="overflow-hidden rounded-xl border border-[#1b3f63] bg-[#050b14]/70"
          >
            <header className="border-b border-[#1b3f63] px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-slate-100">{role.name}</h4>
                <span className="text-xs text-slate-500">
                  {role.permissions.length} permiso
                  {role.permissions.length === 1 ? "" : "s"}
                </span>
              </div>
              {role.description && (
                <p className="mt-1 text-sm text-slate-400">{role.description}</p>
              )}
            </header>

            {role.permissions.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-500 sm:px-5">
                Este rol no tiene permisos asignados.
              </p>
            ) : (
              <div className="divide-y divide-[#1b3f63]">
                {modules.map(({ module, permissions }) => (
                  <section key={module} className="px-4 py-4 sm:px-5">
                    <h5 className="text-xs font-bold uppercase tracking-[0.16em] text-[#3dff7a]/80">
                      {module}
                    </h5>
                    <ul className="mt-3 space-y-2">
                      {permissions.map((permission) => (
                        <li
                          key={permission.id}
                          className="flex flex-wrap items-center gap-2 rounded-lg bg-white/[0.02] px-3 py-2"
                        >
                          <span className="rounded-md bg-[#3dff7a]/10 px-2 py-0.5 text-[11px] font-bold text-[#3dff7a]">
                            {permissionAction(permission.method, permission.url)}
                          </span>
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                            {permission.method}
                          </span>
                          <span className="min-w-0 break-all font-mono text-xs text-slate-300">
                            {permission.url}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};

export default UserAuthorizationPanel;
