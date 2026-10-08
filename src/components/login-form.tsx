"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/app/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="grid gap-4 rounded-md border bg-card p-6">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Lock className="size-3.5" /> Password
        </span>
        <Input name="password" type="password" autoComplete="current-password" autoFocus required className="h-10" />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-11 rounded-full tracking-wide" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
