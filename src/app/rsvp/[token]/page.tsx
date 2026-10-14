import { cookies } from "next/headers";
import { getInviteeFirstName, getPreviewParty, getRsvpParty } from "@/app/actions/rsvp";
import { EnvelopeIntro } from "@/components/rsvp/envelope-intro";
import { RememberInvite } from "@/components/site/remember-invite";
import { RsvpForm } from "@/components/rsvp/rsvp-form";
import { PREVIEW_TOKEN, inviteSummary } from "@/lib/invitation";
import { partyFirstNames } from "@/lib/party";
import { PageShell } from "@/components/site/page-shell";
import { isAdmin } from "@/lib/require-admin";
import { formatDeadline } from "@/lib/rsvp-deadline";
import { headers } from "next/headers";
import { isPreviewBot } from "@/lib/crawlers";
import { getSitePhotos } from "@/app/actions/photos";
import { resolvePhoto } from "@/lib/site-photos";
import { PUBLIC_ORIGIN, hostKind } from "@/lib/hosts";

export const dynamic = "force-dynamic";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const viewport = { themeColor: "#ffffec" };

// The link preview WhatsApp shows: the title carries the guest's first name and
// the image (/invite-card.jpg, the same for every guest) is the invitation card.
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // on our own addresses the preview image is always on the public website address
  const siteUrl = hostKind((await headers()).get("host")) !== "other" ? PUBLIC_ORIGIN : configuredSiteUrl;
  const first = token === PREVIEW_TOKEN ? "Alex" : await getInviteeFirstName(token);
  const title = first ? `${first}, you're invited · Vanessa & Hope` : "You're invited · Vanessa & Hope";
  const description = "Tap to open your invitation and RSVP to our wedding celebrations.";
  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Vanessa & Hope",
      type: "website",
      images: [{ url: "/invite-card.jpg", secureUrl: siteUrl?.startsWith("https") ? new URL("/invite-card.jpg", siteUrl).toString() : undefined, type: "image/jpeg", width: 1200, height: 630, alt: "Your invitation from Vanessa & Hope" }],
    },
    robots: { index: false, follow: false },
  };
}

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ name?: string; known?: string; open?: string }>;
}) {
  const { token } = await params;
  // Link-preview robots only read the title and picture (see generateMetadata), and give up quickly, so they get a
  // tiny page and none of the real page's database work.
  if (isPreviewBot((await headers()).get("user-agent"))) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl font-light tracking-[0.1em] uppercase" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
          You&apos;re invited
        </h1>
        <p className="mt-4 text-muted-foreground">Vanessa &amp; Hope</p>
      </div>
    );
  }
  const { name, known, open } = await searchParams;
  const preview = token === PREVIEW_TOKEN;
  const rowsPromise = getSitePhotos(); // started now so it runs alongside the invitation lookup below
  // The made-up preview guest is for the planner only; to everyone else it is just an unknown link.
  const party = preview
    ? (await isAdmin())
      ? await getPreviewParty(name?.slice(0, 30) || undefined, {
          knownPlusOne: known?.slice(0, 30) || undefined,
          openSlots: Number(open) || 0,
        })
      : null
    : await getRsvpParty(token);
  const rows = await rowsPromise;
  const hero = resolvePhoto("hero-rsvp", rows);
  const painting = resolvePhoto("invite-painting", rows);

  // Guests who have already opened their envelope go straight to the page.
  const cookieName = preview ? null : `opened-${token.slice(0, 16)}`;
  const opened = cookieName ? (await cookies()).has(cookieName) : false;

  const content = (
    <>
      {party && !preview && <RememberInvite token={token} />}
      <PageShell title="RSVP" intro={party && party.events.length > 0 ? "Please let us know who can join us." : undefined} hero={hero}>
        <div className="mx-auto w-full max-w-xl px-4 py-10 pb-16 sm:py-14">
          {preview && (
            <div className="mb-6 rounded-md bg-[#3a3a3a] px-4 py-2 text-center text-xs tracking-wide text-[#ffffec]">
              Preview: this is what your guests see. Replies here aren&apos;t saved.
            </div>
          )}
          {party && party.events.length > 0 ? (
            <RsvpForm party={party} token={token} preview={preview} />
          ) : (
            <div className="rounded-md border bg-card p-8 text-center">
              <h2 className="text-xl font-medium">{party ? "No invitations yet" : "We couldn't find that invitation"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {party
                  ? "Your invitation hasn't been opened yet. Please check back soon."
                  : "Please use the personal link we sent you, or get in touch with us."}
              </p>
            </div>
          )}
        </div>
      </PageShell>
    </>
  );

  // Unknown links get the plain page, with no envelope.
  if (!party || party.events.length === 0) return content;

  return (
    <>
      <EnvelopeIntro
        firstName={partyFirstNames(party.members)}
        summary={inviteSummary(party.events)}
        deadline={party.deadline ? formatDeadline(party.deadline) : null}
        cookieName={cookieName}
        skip={opened}
        art={{ src: painting.src, focus: painting.focus }}
      >
        {content}
      </EnvelopeIntro>
    </>
  );
}
