export type SnackbarVariant = 'error' | 'info' | 'success';

export type SnackbarPayload = {
  message: string;
  variant: SnackbarVariant;
  durationMs?: number;
};

type Listener = (payload: SnackbarPayload) => void;

const listeners = new Set<Listener>();

function emit(payload: SnackbarPayload) {
  listeners.forEach((l) => {
    try {
      l(payload);
    } catch {
      // ignore listener errors
    }
  });
}

export const SnackbarUtilities = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  error(message: string, durationMs?: number) {
    const msg = (message ?? '').trim();
    if (!msg) return;
    emit({ message: msg, variant: 'error', durationMs });
  },

  info(message: string, durationMs?: number) {
    const msg = (message ?? '').trim();
    if (!msg) return;
    emit({ message: msg, variant: 'info', durationMs });
  },

  success(message: string, durationMs?: number) {
    const msg = (message ?? '').trim();
    if (!msg) return;
    emit({ message: msg, variant: 'success', durationMs });
  },
};

