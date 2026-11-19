export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: FieldErrors;

  constructor(message: string, options: { status: number; code?: string; fieldErrors?: FieldErrors }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) {
    const validationMessage = !error.message || error.message === "Invalid request body"
      ? Object.values(error.fieldErrors ?? {})[0]?.[0]
      : undefined;
    return validationMessage || error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function toApiError(value: unknown, status: number): ApiError {
  const body = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const issues = Array.isArray(body.issues) ? body.issues : [];
  const fields: Record<string, string[]> = {};
  for (const issue of issues) {
    if (typeof issue !== "object" || issue === null) continue;
    const item = issue as { path?: unknown; message?: unknown };
    if (typeof item.message !== "string") continue;
    const path = typeof item.path === "string" && item.path ? item.path : "_form";
    fields[path] = [...(fields[path] ?? []), item.message];
  }
  const message = typeof body.message === "string" ? body.message : "The request could not be completed.";
  return new ApiError(message, {
    status,
    code: typeof body.error === "string" ? body.error : undefined,
    fieldErrors: Object.keys(fields).length ? fields : undefined,
  });
}
