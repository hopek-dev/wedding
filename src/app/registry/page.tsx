import { listRegistryAdmin } from "@/app/actions/registry";
import { RegistryManager } from "@/components/registry/registry-manager";

export const dynamic = "force-dynamic";

export default async function RegistryPage() {
  const res = await listRegistryAdmin();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Gift registry</h1>
        <p className="text-sm text-muted-foreground">
          Paste a link to anything from any shop. Guests see it on the wedding site&rsquo;s Gift List, buy it from the shop, and tap &ldquo;I&rsquo;ve bought this&rdquo; so nobody doubles up. Once they do, they can&rsquo;t change it. Only you can see who bought what, and you can remove an entry if it was marked by mistake.
        </p>
      </div>
      {res.ok ? (
        <RegistryManager items={res.items} claims={res.claims} />
      ) : (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium">{res.error}</p>
        </div>
      )}
    </div>
  );
}
