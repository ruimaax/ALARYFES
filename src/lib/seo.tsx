import type { Metadata } from "next";
import Link from "next/link";
import { sitio } from "@/data/sitio";
export function meta(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title: { absolute: `${title} | ${sitio.nombre}` },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | ${sitio.nombre}`,
      description,
      url: path,
      type: "website",
      locale: "es_ES",
      siteName: sitio.nombre,
    },
    twitter: { card: "summary", title, description },
  };
}
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          ...data,
        }).replace(/</g, "\\u003c"),
      }}
    />
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  const all = [{ label: "Inicio", href: "/" }, ...items];
  return (
    <>
      <nav className="breadcrumbs" aria-label="Ruta de navegación">
        <ol>
          {all.map((item, index) => (
            <li key={item.href}>
              {index === all.length - 1 ? (
                <span aria-current="page">{item.label}</span>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: `${sitio.url}${item.href}`,
          })),
        }}
      />
    </>
  );
}
