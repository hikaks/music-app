export type AppErrorLike = {
  message?: string;
  error?: string;
  nextActions?: string;
  statusCode?: number;
};

export function toAppErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (!error) {
    return fallback;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const appError = error as AppErrorLike;
    return appError.message ?? appError.error ?? fallback;
  }

  return fallback;
}
