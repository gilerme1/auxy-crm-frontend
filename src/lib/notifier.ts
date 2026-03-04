"use client";
import type { NotifyPayload } from "./types-notifier";

export async function notify(opts: { title?: string; description?: string; variant?: string }) {
  // Try to use Sonner first (preferred), then SweetAlert2, then internal toast as fallback
  const title = opts.title ?? '';
  const description = opts.description ?? '';
  const message = description ? `${title} - ${description}` : title;
  try {
    const sonner = await import('sonner');
    if (sonner?.toast) {
      switch (opts.variant) {
        case 'success':
          if (typeof sonner.toast.success === 'function') {
            sonner.toast.success(message);
          } else {
            sonner.toast(message);
          }
          return;
        case 'warning':
        case 'info':
        default:
          if (typeof sonner.toast === 'function') {
            sonner.toast(message);
          }
          return;
        case 'error':
        case 'destructive':
          if (typeof sonner.toast.error === 'function') {
            sonner.toast.error(message);
          } else {
            sonner.toast(message);
          }
          return;
      }
    }
  } catch {
    // Sonner not available; try SweetAlert2 next
  }

  // Try SweetAlert2 for highly destructive/confirmations if needed (non-blocking by design)
  try {
    const Swal = await import('sweetalert2');
    // You can wire Swal.fire here for non-blocking alerts if desired; for now, skip to internal toast to avoid UX blocking
  } catch {
    // SwAll not available; continue to internal toast
  }

  // Fallback: internal toast (no external deps)
  try {
    const mod = await import('@/hooks/use-toast');
    // @ts-ignore
    if (mod?.toast) {
      mod.toast({ title: opts.title, description: opts.description, variant: opts.variant as any });
      return;
    }
  } catch {
    // ignore
  }
}

export default notify;
