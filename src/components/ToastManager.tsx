import { useEffect } from "react";
import { useToasts } from "@/store/appStore";
import { toast } from "sonner";

// Toast manager that connects Zustand store to Sonner toasts
export function ToastManager() {
  const { toasts, removeToast } = useToasts();

  useEffect(() => {
    toasts.forEach((toastItem) => {
      // Show toast using Sonner
      const toastId = toast[toastItem.type](toastItem.description, {
        id: toastItem.id,
        description: toastItem.title,
        action: toastItem.action ? {
          label: toastItem.action.label,
          onClick: toastItem.action.onClick,
        } : undefined,
        duration: toastItem.duration,
        onDismiss: () => removeToast(toastItem.id),
        onAutoClose: () => removeToast(toastItem.id),
      });

      // Remove from store after showing
      removeToast(toastItem.id);
    });
  }, [toasts, removeToast]);

  return null; // This component doesn't render anything
}

export default ToastManager;