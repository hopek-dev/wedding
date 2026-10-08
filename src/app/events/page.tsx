import { listEvents } from "@/app/actions/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventEditDialog } from "@/components/events/event-edit-dialog";
import { EventOrderButtons } from "@/components/events/event-order-buttons";
import { formatDateTime } from "@/lib/format";
import { MapPin, Shirt, StickyNote } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await listEvents();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Events</h1>
        <p className="text-sm text-muted-foreground">
          The full day in one place. Use the arrows to change the order events appear in across the app.
        </p>
      </div>

      <div className="grid gap-4">
        {events.map((event, index) => (
          <Card key={event.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{event.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(event.starts_at)}
                  {event.ends_at ? ` – ${formatDateTime(event.ends_at)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {events.length > 1 && (
                  <EventOrderButtons ids={events.map((e) => e.id)} index={index} name={event.name} />
                )}
                <EventEditDialog event={event} />
              </div>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <div className="font-medium">{event.venue_name || "Venue TBD"}</div>
                  <div className="text-muted-foreground">{event.address}</div>
                </div>
              </div>
              {event.dress_code && (
                <div className="flex items-center gap-2">
                  <Shirt className="size-4 shrink-0 text-muted-foreground" />
                  <span>{event.dress_code}</span>
                </div>
              )}
              {event.notes && (
                <div className="flex items-start gap-2">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{event.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
