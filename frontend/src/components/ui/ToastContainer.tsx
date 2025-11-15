"use client";

import Toast from "./Toast";

type ToastData = {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
};

type ToastContainerProps = {
  toasts: ToastData[];
  onRemove: (id: number) => void;
};

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
