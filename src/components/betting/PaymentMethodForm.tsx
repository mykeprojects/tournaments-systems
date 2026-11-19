import { useEffect, useState, type FormEvent } from "react";
import type { FanPaymentMethod, PaymentMethodCatalog } from "../../models/betting";
import { Field } from "../../sports/ui";

export interface PaymentMethodFormValue {
  paymentMethodId: number;
  maskedReference?: string;
  holderName?: string;
  isActive: boolean;
}

interface PaymentMethodFormProps {
  catalog: PaymentMethodCatalog[];
  method?: FanPaymentMethod | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (value: PaymentMethodFormValue) => void;
}

export default function PaymentMethodForm({
  catalog,
  method,
  submitting,
  onCancel,
  onSubmit,
}: PaymentMethodFormProps) {
  const [paymentMethodId, setPaymentMethodId] = useState(method?.paymentMethodId ?? 0);
  const [maskedReference, setMaskedReference] = useState(method?.maskedReference === "***" ? "" : method?.maskedReference ?? "");
  const [holderName, setHolderName] = useState(method?.holderName ?? "");
  const [isActive, setIsActive] = useState(method?.isActive ?? true);

  useEffect(() => {
    setPaymentMethodId(method?.paymentMethodId ?? 0);
    setMaskedReference(method?.maskedReference === "***" ? "" : method?.maskedReference ?? "");
    setHolderName(method?.holderName ?? "");
    setIsActive(method?.isActive ?? true);
  }, [method]);

  const selected = catalog.find((item) => item.id === paymentMethodId);
  const referenceRequired =
    selected?.type === "CARD" ||
    selected?.type === "BANK_ACCOUNT" ||
    selected?.type === "DIGITAL_WALLET";
  const holderRequired = selected?.type === "CARD" || selected?.type === "BANK_ACCOUNT";
  const canSubmit =
    (!method ? paymentMethodId > 0 : true) &&
    (!referenceRequired || maskedReference.trim().length > 0) &&
    (!holderRequired || holderName.trim().length > 0) &&
    !submitting;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      paymentMethodId,
      maskedReference: maskedReference.trim() || undefined,
      holderName: holderName.trim() || undefined,
      isActive,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Tipo de método" required>
        <select
          required
          disabled={Boolean(method)}
          value={paymentMethodId || ""}
          onChange={(event) => setPaymentMethodId(Number(event.target.value))}
          className="mt-1 w-full rounded-lg border border-white/10 bg-[#071321] px-3 py-2.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="" disabled>Selecciona un método</option>
          {catalog.filter((item) => item.is_active).map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </Field>

      {selected && (
        <p className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
          {selected.description}
        </p>
      )}

      {(referenceRequired || maskedReference) && (
        <Field label="Referencia enmascarada" required={referenceRequired} error={
          referenceRequired && !maskedReference.trim() ? "Ingresa una referencia enmascarada." : undefined
        }>
          <input
            value={maskedReference}
            onChange={(event) => setMaskedReference(event.target.value)}
            maxLength={40}
            placeholder="Ej: •••• 4242"
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#071321] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
          />
        </Field>
      )}

      {(holderRequired || holderName) && (
        <Field label="Titular" required={holderRequired} error={
          holderRequired && !holderName.trim() ? "Ingresa el nombre del titular." : undefined
        }>
          <input
            value={holderName}
            onChange={(event) => setHolderName(event.target.value)}
            maxLength={120}
            placeholder="Nombre del titular"
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#071321] px-3 py-2.5 text-sm text-white placeholder:text-slate-500"
          />
        </Field>
      )}

      <label className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-3 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="h-4 w-4 accent-[#3dff7a]"
        />
        Método activo
      </label>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300">
          Cancelar
        </button>
        <button type="submit" disabled={!canSubmit} className="rounded-lg bg-[#3dff7a] px-4 py-2 text-sm font-black text-[#04210f] disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? "Guardando…" : method ? "Guardar cambios" : "Registrar método"}
        </button>
      </div>
    </form>
  );
}
