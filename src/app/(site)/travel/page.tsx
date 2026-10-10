import type { ReactNode } from "react";
import { Bus, Car, Globe, MapPin, Phone, Plane, TrainFront } from "lucide-react";
import { PageShell, pill } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { TRAVEL, VENUE, mapEmbed, mapLink } from "@/lib/site-content";
import { VENUE_FULL_NAME, directionsLink } from "@/lib/schedule";

export const metadata = { title: "Travel" };

const card = "bg-card px-6 py-9 shadow-[0_18px_44px_-30px_rgba(70,62,30,0.45)] ring-1 ring-foreground/10 sm:px-9";
const serif = { fontFamily: "var(--font-cormorant), Georgia, serif" } as const;
const wayIcons = [Bus, TrainFront, Car];

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground ring-1 ring-foreground/10">{children}</span>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-center text-2xl font-light tracking-[0.12em] uppercase sm:text-3xl" style={serif}>
      {children}
    </h2>
  );
}

export default function TravelPage() {
  const tel = TRAVEL.venuePhone.replace(/[^+\d]/g, "");
  return (
    <PageShell title="Travel" intro="Everything takes place at one venue." wide>
      <div className="mx-auto grid max-w-3xl gap-7">
        {/* Getting here */}
        <Reveal>
          <section className={card}>
            <Badge>
              <Plane className="size-5" strokeWidth={1.4} />
            </Badge>
            <Heading>Getting here</Heading>
            <p className="mx-auto mt-5 max-w-xl text-center text-base leading-[1.85] font-light">{TRAVEL.gettingHere}</p>
          </section>
        </Reveal>

        {/* Getting to the venue */}
        <Reveal>
          <section className={card}>
            <Heading>Getting to the venue</Heading>
            <p className="mt-4 text-center text-base font-light text-muted-foreground">{TRAVEL.waysIntro}</p>
            <ol className="mt-8 grid gap-7 sm:gap-8">
              {TRAVEL.ways.map((w, i) => {
                const Icon = wayIcons[i] ?? Car;
                return (
                  <li key={w.title} className="grid gap-3 text-center sm:grid-cols-[3rem_1fr] sm:gap-5 sm:text-left">
                    <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-muted-foreground ring-1 ring-foreground/10 sm:mx-0">
                      <Icon className="size-5" strokeWidth={1.4} />
                    </span>
                    <div>
                      <h3 className="text-xl font-light tracking-[0.1em] uppercase" style={serif}>
                        {i + 1}. {w.title}
                      </h3>
                      <p className="mt-1.5 text-[15px] leading-[1.8] font-light text-muted-foreground">{w.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </Reveal>

        {/* The venue: contact, directions and map */}
        <Reveal>
          <section className={`${card} !px-0 !pb-0`}>
            <div className="px-6 text-center sm:px-9">
              <Badge>
                <MapPin className="size-5" strokeWidth={1.4} />
              </Badge>
              <Heading>{VENUE.name}</Heading>
              <address className="mt-4 text-[15px] leading-relaxed font-light not-italic text-muted-foreground">
                {VENUE_FULL_NAME},<br />
                {VENUE.address.join(", ")}
              </address>
              <div className="mt-5 flex flex-col items-center gap-1 text-[15px] font-light">
                <a href={TRAVEL.venueWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
                  <Globe className="size-4" strokeWidth={1.5} /> {TRAVEL.venueWebsiteLabel}
                </a>
                <a href={`tel:${tel}`} className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
                  <Phone className="size-4" strokeWidth={1.5} /> {TRAVEL.venuePhone}
                </a>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-3 pb-8">
                <a href={directionsLink} target="_blank" rel="noopener noreferrer" className={pill}>
                  Get directions
                </a>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-full px-7 text-sm font-medium tracking-wide ring-1 ring-foreground/25 transition-colors hover:bg-secondary"
                >
                  Open in Maps
                </a>
              </div>
            </div>
            <iframe
              title={`Map of ${VENUE.name}`}
              src={mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="pointer-events-none block h-72 w-full border-0 bg-secondary sm:pointer-events-auto sm:h-96"
            />
          </section>
        </Reveal>

        {/* High season */}
        <Reveal>
          <section className="px-2 text-center">
            <h2 className="text-xl font-light tracking-[0.12em] uppercase sm:text-2xl" style={serif}>
              {TRAVEL.highSeason.heading}
            </h2>
            <div className="ornament my-4" aria-hidden>
              <i />
            </div>
            <p className="mx-auto max-w-xl text-base leading-[1.85] font-light text-muted-foreground">{TRAVEL.highSeason.text}</p>
          </section>
        </Reveal>
      </div>
    </PageShell>
  );
}
