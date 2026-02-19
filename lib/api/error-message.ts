export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const data = (error as { response?: { data?: Record<string, unknown> } }).response?.data;

    const message = data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const detail = data?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    const title = data?.title;

    if (typeof title === "string" && title.trim()) {
      return title;
    }

    const errors = data?.errors;

    if (typeof errors === "object" && errors !== null) {
      const firstErrorList = Object.values(errors).find((value) => Array.isArray(value)) as
        | unknown[]
        | undefined;
      const firstError =
        firstErrorList?.find((value) => typeof value === "string") ?? firstErrorList?.[0];

      if (typeof firstError === "string" && firstError.trim()) {
        return firstError;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
