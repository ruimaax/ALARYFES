import Link from "next/link";
import { articulosPublicados } from "@/data/blog";
import { sitio } from "@/data/sitio";
import { PageIntro } from "@/components/content";
import { meta } from "@/lib/seo";
export const metadata = meta("Blog", sitio.blog.texto, "/blog");
export default function BlogPage() {
  const posts = articulosPublicados();
  return (
    <>
      <PageIntro
        title={sitio.blog.titulo}
        description={sitio.blog.texto}
        path="/blog"
        label="Blog"
        dark
      />
      <section className="section">
        <div className="container">
          {posts.length ? (
            <div className="blog-grid">
              {posts.map((post) => (
                <article key={post.slug}>
                  <time dateTime={post.fecha}>{post.fecha}</time>
                  <h2>
                    <Link href={`/blog/${post.slug}`}>{post.titulo}</Link>
                  </h2>
                  <p>{post.descripcion}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="lead">{sitio.blog.vacio}</p>
          )}
        </div>
      </section>
    </>
  );
}
