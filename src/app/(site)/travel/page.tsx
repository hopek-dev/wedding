import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import { Car, Globe, MapPin, Navigation, Phone, TrainFront } from "lucide-react";
import { Container, PageShell, SectionTitle, pill, pillOutline } from "@/components/site/page-shell";
import { PhotoBand } from "@/components/site/photo-band";
import { Reveal } from "@/components/site/reveal";
import { TRAVEL, VENUE, mapEmbed } from "@/lib/site-content";
import { VENUE_FULL_NAME, directionsLink } from "@/lib/schedule";
import { mapLink } from "@/lib/site-content";

export const metadata = { title: "Travel" };

const serif = { fontFamily: "var(--font-cormorant), Georgia, serif" } as const;
const wayIcons = [Navigation, TrainFront, Car];

export const revalidate = 120;

export default async function TravelPage() {
  const rows = await getSitePhotos();
  const tel = TRAVEL.venuePhone.replace(/[^+\d]/g, "");
  return (
    <PageShell
      title="Travel"
      intro="Everything takes place at one venue."
      hero={resolvePhoto("hero-travel", rows)}
    >
      <Container className="py-16 sm:py-24">
        <SectionTitle eyebrow="Before you set off">Getting here</SectionTitle>
        <Reveal>
          <p className="mx-auto mt-10 max-w-xl text-center text-[1.35rem] leading-[1.85] font-light sm:text-[1.55rem]" style={serif}>
            {TRAVEL.gettingHere}
          </p>
        </Reveal>
      </Container>

      <PhotoBand photo={resolvePhoto("travel-band", rows)} />

      <Container className="py-16 sm:py-24">
        <SectionTitle eyebrow={TRAVEL.waysIntro}>Getting to the venue</SectionTitle>
        <ol className="mt-14 grid gap-14">
          {TRAVEL.ways.map((w, i) => {
            const Icon = wayIcons[i] ?? Car;
            return (
              <li key={w.title}>
                <Reveal>
                  <div className="border-t border-foreground/15 pt-8 text-center">
                    <Icon className="mx-auto size-7 text-muted-foreground" strokeWidth={1} />
                    <h3 className="mt-5 text-3xl font-light tracking-[0.1em] uppercase" style={serif}>
                      {i + 1}. {w.title}
                    </h3>
                    <p className="mx-auto mt-3 max-w-xl text-[15px] leading-[1.85] font-light whitespace-pre-line text-muted-foreground">{w.text}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </Container>

      {/* The venue: contact and directions, then the map right across the page */}
      <Container className="pb-10 text-center">
        <SectionTitle eyebrow="Where it all happens">{VENUE.name}</SectionTitle>
        <Reveal>
          <address className="mt-10 text-[15px] leading-relaxed font-light not-italic text-muted-foreground">
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
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={directionsLink} target="_blank" rel="noopener noreferrer" className={pill}>
              <MapPin className="mr-2 size-4" strokeWidth={1.6} /> Get directions
            </a>
            <a href={mapLink} target="_blank" rel="noopener noreferrer" className={pillOutline}>
              Open in Maps
            </a>
          </div>
        </Reveal>
      </Container>
      <iframe
        title={`Map of ${VENUE.name}`}
        src={mapEmbed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="pointer-events-none mt-10 block h-[60svh] min-h-[320px] w-full border-0 bg-secondary sm:pointer-events-auto"
      />

      <Container className="py-20 sm:py-28">
        <Reveal>
          <section className="text-center">
            <h2 className="text-2xl font-light tracking-[0.12em] uppercase sm:text-3xl" style={serif}>
              {TRAVEL.highSeason.heading}
            </h2>
            <div className="ornament my-5" aria-hidden>
              <i />
            </div>
            <p className="mx-auto max-w-xl text-base leading-[1.85] font-light text-muted-foreground">{TRAVEL.highSeason.text}</p>
          </section>
        </Reveal>
      </Container>
    </PageShell>
  );
}
