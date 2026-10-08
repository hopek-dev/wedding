import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in · Vanessa & Hope", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto grid min-h-[80dvh] w-full max-w-sm content-center gap-8 px-2">
      <div className="text-center">
        <h1 className="font-cursive whitespace-nowrap text-5xl leading-tight text-muted-foreground sm:text-6xl">Vanessa &amp; Hope</h1>
        <p className="mt-2 text-[13px] font-light tracking-[0.3em] text-muted-foreground uppercase">Wedding planner</p>
      </div>
      <LoginForm next={next ?? "/"} />
    </div>
  );
}
