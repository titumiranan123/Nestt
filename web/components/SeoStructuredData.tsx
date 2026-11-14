export function SeoStructuredData({ content }: { content: string | null }) {
  if (!content) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const safeJson = JSON.stringify(parsed).replaceAll("<", "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson }} />;
}
