"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Link2, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markEmailed } from "@/app/actions/guests";
import { markInviteSent } from "@/app/actions/invites";
import { isLocalOrigin, normalizePhone, renderTemplate, rsvpUrl, savedInviteTemplate, siteOrigin, whatsappLink } from "@/lib/whatsapp";

export function RsvpLinkButton({
  guestId,
  token,
  firstName,
  email,
  phone,
  responded,
}: {
  guestId: string;
  token: string;
  firstName: string;
  email: string | null;
  phone: string | null;
  responded: boolean;
}) {
  const router = useRouter();
  const link = () => rsvpUrl(token);
  const whatsapp = normalizePhone(phone);

  // A link to localhost can't be opened by guests and WhatsApp won't make it
  // tappable or show a preview, so stop before sending something broken.
  function publicLinkOrWarn() {
    if (isLocalOrigin(siteOrigin())) {
      toast.error(
        "This link points to your own computer. Deploy the app and set NEXT_PUBLIC_SITE_URL to its live address before sending invitations."
      );
      return false;
    }
    return true;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      toast.success("RSVP link copied");
    } catch {
      toast.error("Couldn't copy. Open the link instead: " + link());
    }
  }

  // Opens WhatsApp with the invitation ready to send (see the Invitations page
  // for sending to everyone and editing the message).
  function sendWhatsApp() {
    if (!whatsapp || !publicLinkOrWarn()) return;
    const text = renderTemplate(savedInviteTemplate(), { first_name: firstName, full_name: firstName, link: link() });
    window.open(whatsappLink(whatsapp, text), "_blank", "noopener,noreferrer");
    markInviteSent(guestId, "whatsapp")
      .then(() => router.refresh())
      .catch(() => toast.error("Opened WhatsApp, but couldn't record it as sent."));
  }

  async function compose() {
    if (!publicLinkOrWarn()) return;
    const subject = encodeURIComponent("You're invited: Vanessa & Hope are getting hitched!");
    const body = encodeURIComponent(
      `Hi ${firstName},\n\nWe'd love you to celebrate with us. Please RSVP here:\n${link()}\n\nWith love,\nVanessa & Hope`
    );
    await markEmailed(guestId).catch(() => {});
    router.refresh();
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="flex items-center gap-1">
      {responded && <Check className="size-3.5 text-emerald-600" aria-label="Responded" />}
      <Button variant="ghost" size="icon" className="size-7" onClick={copy} title="Copy RSVP link">
        <Link2 className="size-3.5" />
      </Button>
      {whatsapp && (
        <Button variant="ghost" size="icon" className="size-7" onClick={sendWhatsApp} title="Send on WhatsApp">
          <MessageCircle className="size-3.5" />
        </Button>
      )}
      {email && (
        <Button variant="ghost" size="icon" className="size-7" onClick={compose} title="Email RSVP link">
          <Mail className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
