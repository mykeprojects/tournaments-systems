import type { FormEvent } from "react";
import {
  PHONE_DIGIT_COUNT,
  PHONE_NUMBER_MESSAGE,
  sanitizePhoneNumber,
} from "../../domain/profile/phoneNumber";
import BirthDatePicker from "./BirthDatePicker";

export type ProfileFormValues = {
  phone: string;
  photoUrl: string;
  birthDate: string;
};

type ProfileFieldsFormProps = {
  values: ProfileFormValues;
  latestBirthDate: string;
  error?: string | null;
  isSaving: boolean;
  inputClassName: string;
  onChange: (values: ProfileFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

const ProfileFieldsForm = ({
  values,
  latestBirthDate,
  error,
  isSaving,
  inputClassName,
  onChange,
  onSubmit,
  onCancel,
}: ProfileFieldsFormProps) => {
  return (
    <form onSubmit={onSubmit} className="mt-6">
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-phone" className="text-sm font-semibold text-slate-200">
            Teléfono
          </label>
          <input
            id="profile-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            maxLength={PHONE_DIGIT_COUNT}
            pattern={`\\d{${PHONE_DIGIT_COUNT}}`}
            title={PHONE_NUMBER_MESSAGE}
            value={values.phone}
            onChange={(event) =>
              onChange({
                ...values,
                phone: sanitizePhoneNumber(event.target.value),
              })
            }
            className={inputClassName}
          />
          <p className="mt-2 text-xs text-slate-500">
            Exactamente {PHONE_DIGIT_COUNT} dígitos, sin espacios ni símbolos.
          </p>
        </div>
        <div>
          <label htmlFor="profile-photo" className="text-sm font-semibold text-slate-200">
            URL de la foto de perfil
          </label>
          <input
            id="profile-photo"
            type="url"
            maxLength={2048}
            value={values.photoUrl}
            onChange={(event) =>
              onChange({ ...values, photoUrl: event.target.value })
            }
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="profile-birth-date" className="text-sm font-semibold text-slate-200">
            Fecha de nacimiento
          </label>
          <BirthDatePicker
            id="profile-birth-date"
            value={values.birthDate}
            max={latestBirthDate}
            required
            inputClassName={inputClassName}
            onChange={(birthDate) => onChange({ ...values, birthDate })}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016] disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar perfil"}
        </button>
      </div>
    </form>
  );
};

export default ProfileFieldsForm;
