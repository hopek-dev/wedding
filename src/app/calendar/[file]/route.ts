import { SCHEDULE, icsFor } from "@/lib/schedule";

// Calendar downloads for the public schedule: /calendar/ceremony.ics for one item,
// /calendar/all.ics for the whole day. Public, like the schedule page itself.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = file.replace(/\.ics$/i, "");
  const items = id === "all" ? SCHEDULE : SCHEDULE.filter((s) => s.id === id);
  if (items.length === 0) return new Response("Not found", { status: 404 });
  return new Response(icsFor(items), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
