import type { ReactNode } from "react";

type FeedbackModalProps = {
  variant: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
  action?: ReactNode;
};

const variantStyles = {
  success: {
    icon: "✓",
    iconClass: "bg-lime-400/15 text-lime-300",
    titleClass: "text-lime-300",
  },
  error: {
    icon: "!",
    iconClass: "bg-red-400/15 text-red-300",
    titleClass: "text-red-300",
  },
} as const;

const FeedbackModal = ({
  variant,
  title,
  message,
  onClose,
  action,
}: FeedbackModalProps) => {
  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-labelledby="feedback-modal-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#102016] p-6 text-white shadow-2xl shadow-black/50"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-black ${styles.iconClass}`}
          >
            {styles.icon}
          </span>
          <div>
            <h2
              id="feedback-modal-title"
              className={`text-xl font-black ${styles.titleClass}`}
            >
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {action ?? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-lime-300/60"
            >
              Cerrar
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default FeedbackModal;
