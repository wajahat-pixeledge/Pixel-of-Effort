export function getSiteUrl(fallbackHost?: string, fallbackProtocol?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  const host = fallbackHost ?? "localhost:3000";
  const protocol = fallbackProtocol ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
