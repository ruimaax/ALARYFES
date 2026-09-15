import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { articulosPublicados } from "@/data/blog";
import { sitio } from "@/data/sitio";
import { Breadcrumbs, JsonLd, meta } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() {
  return articulosPublicados().map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = articulosPublicados().find((p) => p.slug === slug);
  return post
    ? meta(post.titulo, post.descripcion, `/blog/${slug}`, post.imagen)
    : {};
}
const fechaLarga = (valor: string) =>
  new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${valor}T12:00:00Z`));
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = articulosPublicados().find((p) => p.slug === slug);
  if (!post || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) notFound();
  const source = await readFile(
    path.join(process.cwd(), "src/content/blog", `${post.slug}.md`),
    "utf8",
  ).catch(() => null);
  if (source === null) notFound();
  return (
    <article className="section">
      <div className="container narrow">
        <Breadcrumbs
          items={[
            { label: "Blog", href: "/blog" },
            { label: post.titulo, href: `/blog/${slug}` },
          ]}
        />
        <time dateTime={post.fecha}>{fechaLarga(post.fecha)}</time>
        <h1>{post.titulo}</h1>
        <p className="lead intro-copy">{post.descripcion}</p>
        {post.imagen && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="article-cover"
            src={post.imagen}
            alt={post.imagenAlt || ""}
          />
        )}
        <div className="prose-content">
          {/* Markdown puro: sin JSX, expresiones ni HTML incrustado. */}
          <MDXRemote
            source={source}
            options={{
              blockJS: true,
              mdxOptions: { format: "md", remarkPlugins: [remarkGfm] },
            }}
          />
        </div>
        {post.actualizado && post.actualizado !== post.fecha && (
          <p className="table-note">
            Actualizado el{" "}
            <time dateTime={post.actualizado}>
              {fechaLarga(post.actualizado)}
            </time>
          </p>
        )}
        <Link className="text-link" href="/blog">
          {sitio.blog.volver}
        </Link>
      </div>
      <JsonLd
        data={{
          "@type": "BlogPosting",
          headline: post.titulo,
          description: post.descripcion,
          datePublished: post.fecha,
          ...(post.actualizado ? { dateModified: post.actualizado } : {}),
          ...(post.imagen ? { image: `${sitio.url}${post.imagen}` } : {}),
          author: { "@type": "Organization", name: sitio.nombre },
          mainEntityOfPage: `${sitio.url}/blog/${slug}`,
        }}
      />
    </article>
  );
}
