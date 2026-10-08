import { listEvents } from "@/app/actions/events";
import { listGuestsWithRsvps } from "@/app/actions/guests";
import { checkSeatingSetup, listSeating } from "@/app/actions/seating";
import { SeatingBoard } from "@/components/seating/seating-board";

export const dynamic = "force-dynamic";

export default async function SeatingPage() {
  const [events, { guests, rsvps }, { tables, assignments }, setupProblem] = await Promise.all([
    listEvents(),
    listGuestsWithRsvps(),
    listSeating(),
    checkSeatingSetup(),
  ]);

  return (
    <div>
      <SeatingBoard
        events={events}
        guests={guests}
        rsvps={rsvps}
        initialTables={tables}
        initialAssignments={assignments}
        setupProblem={setupProblem}
      />
    </div>
  );
}
