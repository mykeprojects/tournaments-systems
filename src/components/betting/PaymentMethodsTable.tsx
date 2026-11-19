import type { FanPaymentMethod } from "../../models/betting";
import { IconButton, Pager, StatusPill } from "../../sports/ui";

interface PaymentMethodsTableProps {
  methods: FanPaymentMethod[];
  page: number;
  deletingId: number | null;
  onPage: (page: number) => void;
  onView: (method: FanPaymentMethod) => void;
  onEdit: (method: FanPaymentMethod) => void;
  onDelete: (method: FanPaymentMethod) => void;
}

const PAGE_SIZE = 6;

export default function PaymentMethodsTable({
  methods,
  page,
  deletingId,
  onPage,
  onView,
  onEdit,
  onDelete,
}: PaymentMethodsTableProps) {
  const pageCount = Math.max(1, Math.ceil(methods.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = methods.slice(start, start + PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1b3f63] bg-[#071321]/95">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Referencia</th>
              <th className="px-4 py-3">Titular</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((method) => (
              <tr key={method.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-4 text-sm font-bold text-white">{method.paymentMethodName}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{method.maskedReference || "No registrada"}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{method.holderName || "No aplica"}</td>
                <td className="px-4 py-4"><StatusPill status={method.isActive ? "active" : "inactive"} /></td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <IconButton label={`Ver ${method.paymentMethodName}`} tone="view" onClick={() => onView(method)} />
                    <IconButton label={`Editar ${method.paymentMethodName}`} tone="edit" onClick={() => onEdit(method)} />
                    <IconButton
                      label={deletingId === method.id ? "Eliminando…" : `Eliminar ${method.paymentMethodName}`}
                      tone="delete"
                      onClick={() => onDelete(method)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {methods.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-slate-400">Aún no tienes métodos de pago registrados.</p>
      )}
      {methods.length > 0 && (
        <Pager
          page={safePage}
          pageCount={pageCount}
          from={start + 1}
          to={Math.min(start + PAGE_SIZE, methods.length)}
          total={methods.length}
          onPage={onPage}
        />
      )}
    </div>
  );
}
