export function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const message = (error as { response?: { data?: { message?: unknown } } }).response
      ?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
