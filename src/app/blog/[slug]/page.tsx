import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { articulosPublicados } from "@/data/blog";
import { sitio } from "@/data/sitio";
import { Breadcrumbs, JsonLd, meta } from "@/lib/seo";
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
  return post ? meta(post.titulo, post.descripcion, `/blog/${slug}`) : {};
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = articulosPublicados().find((p) => p.slug === slug);
  if (!post) notFound();
  const root = path.join(process.cwd(), "src/data/articulos");
  const file = path.resolve(root, post.archivo);
  if (!file.startsWith(root + path.sep) || !file.endsWith(".mdx")) notFound();
  const source = await readFile(file, "utf8");
  return (
    <article className="section">
      <div className="container narrow">
        <Breadcrumbs
          items={[
            { label: "Blog", href: "/blog" },
            { label: post.titulo, href: `/blog/${slug}` },
          ]}
        />
        <time dateTime={post.fecha}>
          {new Intl.DateTimeFormat("es-ES", {
            dateStyle: "long",
            timeZone: "Europe/Madrid",
          }).format(new Date(post.fecha))}
        </time>
        <h1>{post.titulo}</h1>
        <p className="lead intro-copy">{post.descripcion}</p>
        <div className="prose-content">
          <MDXRemote source={source} options={{ blockJS: true }} />
        </div>
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
          author: { "@type": "Organization", name: sitio.nombre },
          mainEntityOfPage: `${sitio.url}/blog/${slug}`,
        }}
      />
    </article>
  );
}
