import { ChevronDown } from "lucide-react";
import { PageShell } from "@/components/site/page-shell";
import { Reveal } from "@/components/site/reveal";
import { getRsvpDeadline } from "@/app/actions/settings";
import { formatDeadline } from "@/lib/rsvp-deadline";
import { FALLBACK_DEADLINE_TEXT, QA, QA_CONTACT, QA_INTRO } from "@/lib/site-content";

export const metadata = { title: "Q & A" };
export const revalidate = 300;

export default async function QaPage() {
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
    <PageShell title="Q & A" intro={QA_INTRO}>
      <Reveal>
        <div className="divide-y bg-card ring-1 ring-foreground/10">
          {QA.map((item, n) => (
            <details key={item.q} className="faq group" open={n === 0}>
              <summary className="flex min-h-14 items-center justify-between gap-4 px-5 py-5 text-left sm:px-6 sm:py-6">
                <span className="text-xl font-light tracking-wide sm:text-2xl" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                  {item.q}
                </span>
                <ChevronDown className="faq-chevron size-5 shrink-0 text-muted-foreground transition-transform" strokeWidth={1.4} />
              </summary>
              <p className="px-5 pb-7 text-[15px] leading-relaxed font-light text-muted-foreground sm:px-6">
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
    </PageShell>
  );
}
