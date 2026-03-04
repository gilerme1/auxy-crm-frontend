"use client";
import { toast } from "sonner";

export async function notify(opts: { title?: string; description?: string; variant?: string }) {
  const title = opts.title ?? '';
  const description = opts.description ?? '';
  const message = description ? `${title}: ${description}` : title;

  switch (opts.variant) {
    case 'success':
      toast.success(title, { description: opts.description });
      break;
    case 'error':
    case 'destructive':
      toast.error(title, { description: opts.description });
      break;
    case 'warning':
      toast.warning(title, { description: opts.description });
      break;
    case 'info':
    default:
      toast.info(title, { description: opts.description });
      break;
  }
}

export default notify;