"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_DAYS,
  authConfigured,
  createSessionToken,
  passwordMatches,
} from "@/lib/session";

export type LoginState = { error: string } | undefined;

// Only follow a "next" address that stays on this site and isn't the login page.
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!authConfigured()) {
    return { error: "Login isn't set up yet: add ADMIN_PASSWORD to the server's environment variables." };
  }
  const password = String(formData.get("password") ?? "");
  // A pause on every attempt makes guessing the password slow.
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (!(await passwordMatches(password))) return { error: "That password isn't right." };

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
