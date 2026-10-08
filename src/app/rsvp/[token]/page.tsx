import { cookies } from "next/headers";
import Image from "next/image";
import { getInviteeFirstName, getPreviewParty, getRsvpParty } from "@/app/actions/rsvp";
import { EnvelopeIntro } from "@/components/rsvp/envelope-intro";
import { GuestTheme } from "@/components/rsvp/guest-theme";
import { RsvpForm } from "@/components/rsvp/rsvp-form";
import { PREVIEW_TOKEN, invitedName, inviteEventLines } from "@/lib/invitation";
import { WeddingSiteCard } from "@/components/rsvp/wedding-site-card";
import { isAdmin } from "@/lib/require-admin";
import { formatDeadline } from "@/lib/rsvp-deadline";
import { WEDDING_SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const viewport = { themeColor: "#ffffec" };

// The link preview WhatsApp shows: the title carries the guest's first name and
// the image (opengraph-image.tsx) is an invitation card with their full name.
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const first = token === PREVIEW_TOKEN ? "Alex" : await getInviteeFirstName(token);
  const title = first ? `${first}, you're invited · Vanessa & Hope` : "You're invited · Vanessa & Hope";
  const description = "Tap to open your invitation and RSVP to our wedding celebrations.";
  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title,
    description,
    openGraph: { title, description, siteName: "Vanessa & Hope", type: "website" },
    robots: { index: false, follow: false },
  };
}

// Photo strip, as on the wedding website's welcome page. Replace the files in
// public/couple/ with the original photos for full quality.
const strip = [
  { src: "/couple/hero-1.jpg", grow: "hidden sm:block sm:flex-[0.5]" },
  { src: "/couple/hero-2.jpg", grow: "flex-[1.5] sm:flex-[1.8]" },
  { src: "/couple/hero-3.jpg", grow: "flex-[1.5] sm:flex-[1.8]" },
  { src: "/couple/hero-4.jpg", grow: "hidden sm:block sm:flex-1" },
];

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { token } = await params;
  const { name } = await searchParams;
  const preview = token === PREVIEW_TOKEN;
  // The made-up preview guest is for the planner only; to everyone else it is just an unknown link.
  const party = preview
    ? (await isAdmin())
      ? await getPreviewParty(name?.slice(0, 30) || undefined)
      : null
    : await getRsvpParty(token);

  // Guests who have already opened their envelope go straight to the page.
  const cookieName = preview ? null : `opened-${token.slice(0, 16)}`;
  const opened = cookieName ? (await cookies()).has(cookieName) : false;

  const content = (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <GuestTheme />
      {preview && (
        <div className="bg-[#3a3a3a] px-4 py-2 text-center text-xs tracking-wide text-[#ffffec]">
          Preview: this is what your guests see. Replies here aren&apos;t saved.
        </div>
      )}
      <header className="px-6 pt-12 pb-8 text-center">
        <h1 className="font-cursive whitespace-nowrap text-5xl leading-tight text-muted-foreground sm:text-7xl">Vanessa &amp; Hope</h1>
        <nav className="mt-5 flex justify-center gap-7 text-[13px] font-light tracking-wide text-muted-foreground">
          <span className="border-b border-muted-foreground py-1">RSVP</span>
          <a
            href={WEDDING_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border-b border-transparent py-1 transition-colors hover:border-muted-foreground"
          >
            Wedding Website ↗
          </a>
        </nav>
      </header>

      <div className="flex h-44 gap-[3px] bg-white sm:h-72">
        {strip.map((p) => (
          <div key={p.src} className={`relative min-w-0 ${p.grow}`}>
            <Image src={p.src} alt="" fill sizes="(min-width: 640px) 40vw, 50vw" className="object-cover" priority />
          </div>
        ))}
      </div>

      <div className="mx-auto w-full max-w-xl px-4 py-10 pb-16">
        {party && party.events.length > 0 ? (
          <RsvpForm party={party} token={token} preview={preview} />
        ) : (
          <div className="rounded-md border bg-card p-8 text-center">
            <h2 className="text-xl font-medium">
              {party ? "No invitations yet" : "We couldn't find that invitation"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {party
                ? "Your invitation hasn't been opened yet. Please check back soon."
                : "Please use the personal link we sent you, or get in touch with us."}
            </p>
          </div>
        )}
        <WeddingSiteCard className="mt-5" />
      </div>
    </div>
  );

  // Unknown links get the plain page, with no envelope.
  if (!party || party.events.length === 0) return <div className="-mx-4 -my-6 sm:-mx-6 sm:-my-8">{content}</div>;

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 sm:-my-8">
      <EnvelopeIntro
        firstName={party.guest.first_name}
        fullName={invitedName(party.guest)}
        events={inviteEventLines(party.events)}
        deadline={party.deadline ? formatDeadline(party.deadline) : null}
        cookieName={cookieName}
        skip={opened}
      >
        {content}
      </EnvelopeIntro>
    </div>
  );
}
