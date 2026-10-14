// Link-preview robots (WhatsApp, Facebook, iMessage, Slack, Telegram...) fetch a page only to read its title and
// picture, and give up after a few seconds. They get a tiny page so the preview is never missed because the real
// page (several database calls) was slow.
const PREVIEW_BOTS = /whatsapp|facebookexternalhit|facebot|twitterbot|slackbot|discordbot|telegrambot|linkedinbot|skypeuripreview|signal|googlebot|bingbot|applebot|embedly|pinterest|redditbot|vkshare|iframely/i;

export function isPreviewBot(userAgent: string | null | undefined) {
  return !!userAgent && PREVIEW_BOTS.test(userAgent);
}
