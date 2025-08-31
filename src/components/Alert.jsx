import { useEffect } from "react";

export default function Alert({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const color =
    type === "success"
      ? "bg-success-100 border-success-300 text-success-800"
      : type === "error"
      ? "bg-danger-100 border-danger-300 text-danger-800"
      : "bg-secondary-100 border-secondary-300 text-secondary-800";

  return (
    <div className={`fixed top-6 left-1/2 z-50 transform -translate-x-1/2`}>
      <div
        className={`border px-6 py-3 rounded-lg shadow-lg animate-fade-in ${color} flex items-center gap-2`}
      >
        {type === "success" ? (
          <svg
            className="w-5 h-5 text-success-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : type === "error" ? (
          <svg
            className="w-5 h-5 text-danger-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : null}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
