import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import { ChevronDown } from "lucide-react";
import { Container, PageShell } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { getRsvpDeadline } from "@/app/actions/settings";
import { formatDeadline } from "@/lib/rsvp-deadline";
import { FALLBACK_DEADLINE_TEXT, QA, QA_CONTACT, QA_INTRO } from "@/lib/site-content";

export const metadata = { title: "Q & A" };
export const revalidate = 300;

export default async function QaPage() {
  const rows = await getSitePhotos();
  const deadline = await getRsvpDeadline();
  const tel = QA_CONTACT.phone.replace(/[^+\d]/g, "");
  const answerFor = (item: (typeof QA)[number]) => {
    if (item.kind === "deadline") {
      return `Please RSVP by ${deadline ? formatDeadline(deadline) : FALLBACK_DEADLINE_TEXT} so we can get an accurate headcount. 🙂`;
    }
    if (item.kind === "contact") {
      return QA_CONTACT.phone
        ? `If you’ve any questions, please contact ${QA_CONTACT.name} on ${QA_CONTACT.phone}.`
        : `If you’ve any questions, please contact ${QA_CONTACT.name}.`;
    }
    return item.a ?? "";
  };
  return (
    <PageShell title="Q & A" intro={QA_INTRO} hero={resolvePhoto("hero-qa", rows)}>
      <Container className="py-12 sm:py-20">
        <Reveal>
          <div className="border-b border-foreground/15">
            {QA.map((item, n) => (
              <details key={item.q} className="faq group border-t border-foreground/15" open={n === 0}>
                <summary className="flex min-h-16 items-center justify-between gap-4 py-6 text-left">
                  <span className="text-2xl font-light tracking-wide sm:text-[1.65rem]" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                    {item.q}
                  </span>
                  <ChevronDown className="faq-chevron size-5 shrink-0 text-muted-foreground transition-transform duration-500" strokeWidth={1.2} />
                </summary>
                <p className="pb-8 text-[15px] leading-[1.85] font-light text-muted-foreground [font-variant-numeric:lining-nums] sm:max-w-[90%]">
                  {answerFor(item)}
                  {item.kind === "contact" && QA_CONTACT.phone && (
                    <>
                      {" "}
                      <a href={`tel:${tel}`} className="underline underline-offset-4">
                        Call
                      </a>
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </Container>
    </PageShell>
  );
}
