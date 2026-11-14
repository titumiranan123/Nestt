import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return NextResponse.json(
      { message: "Request not allowed." },
      { status: 403 },
    );
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backend)
    return NextResponse.json(
      {
        message:
          "Password reset is not available in this preview. Connect the Nestt backend to use your live account.",
      },
      { status: 503 },
    );
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object")
      return NextResponse.json(
        { message: "Invalid request." },
        { status: 400 },
      );
    const data = body as Record<string, unknown>;
    if (
      !["request", "reset"].includes(String(data.action)) ||
      typeof data.email !== "string" ||
      data.email.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    )
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 },
      );
    if (
      data.action === "reset" &&
      (typeof data.code !== "string" ||
        !/^\d{6}$/.test(data.code) ||
        typeof data.password !== "string" ||
        data.password.length < 12 ||
        data.password.length > 128)
    )
      return NextResponse.json(
        {
          message:
            "Enter a six-digit code and a password of 12–128 characters.",
        },
        { status: 400 },
      );
    const response = await fetch(
      `${backend}/auth/email/${data.action === "request" ? "forgot-password" : "reset-password"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          data.action === "request"
            ? { email: data.email }
            : { email: data.email, code: data.code, password: data.password },
        ),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok)
      return NextResponse.json(
        {
          message:
            response.status === 429
              ? "Too many attempts. Please wait before trying again."
              : data.action === "reset"
                ? "Could not reset your password. Check your code or request a new one."
                : "Could not request a verification code. Please try again later.",
        },
        { status: response.status >= 500 ? 502 : response.status },
      );
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        message: "Unable to reach the account service. Please try again later.",
      },
      { status: 502 },
    );
  }
}
