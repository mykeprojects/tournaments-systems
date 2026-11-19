import { useCallback, useEffect, useState } from "react";
import PaymentMethodForm, { type PaymentMethodFormValue } from "../../components/betting/PaymentMethodForm";
import PaymentMethodsTable from "../../components/betting/PaymentMethodsTable";
import Icon from "../../components/icons/Icon";
import { readSportError } from "../../infrastructure/backend/SportHttpClient";
import type { FanPaymentMethod, PaymentMethodCatalog } from "../../models/betting";
import { bettingService } from "../../services/bettingService";
import { Modal, NoticeBanner, PageHeader, Panel, type Notice } from "../../sports/ui";

export default function FanPaymentMethodsPage() {
  const [methods, setMethods] = useState<FanPaymentMethod[]>([]);
  const [catalog, setCatalog] = useState<PaymentMethodCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FanPaymentMethod | null>(null);
  const [viewing, setViewing] = useState<FanPaymentMethod | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const results = await Promise.allSettled([
      bettingService.listPaymentMethods(),
      bettingService.listPaymentMethodCatalog(),
    ]);
    const [owned, base] = results;
    const errors: string[] = [];
    if (owned.status === "fulfilled") setMethods(owned.value);
    else errors.push(readSportError(owned.reason));
    if (base.status === "fulfilled") setCatalog(base.value);
    else errors.push(readSportError(base.reason));
    setLoadError(errors.length ? errors.join(" ") : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (method: FanPaymentMethod) => {
    setEditing(method);
    setFormOpen(true);
  };

  const saveMethod = async (value: PaymentMethodFormValue) => {
    setSubmitting(true);
    setNotice(null);
    try {
      if (editing) {
        await bettingService.updatePaymentMethod(editing.id, {
          maskedReference: value.maskedReference,
          holderName: value.holderName,
          isActive: value.isActive,
        });
        setNotice({ tone: "ok", title: "Método actualizado", message: "Los cambios quedaron almacenados." });
      } else {
        await bettingService.createPaymentMethod({
          paymentMethodId: value.paymentMethodId,
          maskedReference: value.maskedReference,
          holderName: value.holderName,
          isActive: value.isActive,
        });
        setNotice({ tone: "ok", title: "Método registrado", message: "El método quedó asociado a tu cuenta." });
      }
      setFormOpen(false);
      setEditing(null);
      await loadData();
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMethod = async (method: FanPaymentMethod) => {
    if (!window.confirm(`¿Eliminar o desactivar el método ${method.paymentMethodName}?`)) return;
    setDeletingId(method.id);
    setNotice(null);
    try {
      const result = await bettingService.removePaymentMethod(method.id);
      setNotice({ tone: "ok", title: "Método eliminado", message: result.message });
      await loadData();
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<Icon name="idCard" className="h-5 w-5" />}
        title="Métodos de pago"
        subtitle="Registra, consulta, actualiza y desactiva tus opciones de pago."
        actions={
          <button
            type="button"
            onClick={openCreate}
            disabled={catalog.length === 0}
            className="rounded-lg bg-[#3dff7a] px-4 py-2 text-sm font-black text-[#04210f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Registrar método
          </button>
        }
      />
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
      {loadError && (
        <NoticeBanner notice={{ tone: "error", message: loadError }} onClose={() => setLoadError(null)} />
      )}

      {loading ? (
        <Panel><p className="px-4 py-8 text-center text-sm text-slate-400">Cargando métodos de pago…</p></Panel>
      ) : (
        <PaymentMethodsTable
          methods={methods}
          page={page}
          deletingId={deletingId}
          onPage={setPage}
          onView={setViewing}
          onEdit={openEdit}
          onDelete={(method) => void deleteMethod(method)}
        />
      )}

      {formOpen && (
        <Modal title={editing ? "Modificar método de pago" : "Registrar método de pago"} onClose={() => {
          if (!submitting) {
            setFormOpen(false);
            setEditing(null);
          }
        }}>
          <PaymentMethodForm
            catalog={catalog}
            method={editing}
            submitting={submitting}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSubmit={(value) => void saveMethod(value)}
          />
        </Modal>
      )}

      {viewing && (
        <Modal title="Detalle del método de pago" onClose={() => setViewing(null)}>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Tipo", viewing.paymentMethodName],
              ["Referencia", viewing.maskedReference || "No registrada"],
              ["Titular", viewing.holderName || "No aplica"],
              ["Estado", viewing.isActive ? "Activo" : "Inactivo"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-3">
                <dt className="text-xs font-semibold text-slate-400">{label}</dt>
                <dd className="mt-1 text-sm font-bold text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </div>
  );
}
