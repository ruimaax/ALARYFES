"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { cookiesTextos } from "@/data/legal";
const ga = process.env.NEXT_PUBLIC_GA_ID || "";
const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const enabled = /^G-[A-Z0-9]+$/.test(ga) || /^\d+$/.test(pixel);
export function AnalyticsConsent({ settings = false }: { settings?: boolean }) {
  const [choice, setChoice] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setChoice(localStorage.getItem("alaryfes-analytics"));
    const update = () => setChoice(localStorage.getItem("alaryfes-analytics"));
    window.addEventListener("alaryfes-consent", update);
    return () => window.removeEventListener("alaryfes-consent", update);
  }, []);
  function choose(value: "accepted" | "rejected") {
    const hadConsent = choice === "accepted";
    localStorage.setItem("alaryfes-analytics", value);
    setChoice(value);
    window.dispatchEvent(new Event("alaryfes-consent"));
    if (value === "rejected") {
      window.fbq?.("consent", "revoke");
      for (const item of document.cookie.split(";")) {
        const name = item.split("=")[0].trim();
        if (/^(_ga|_gid|_gat|_fbp|_fbc)/.test(name)) {
          document.cookie = `${name}=; Max-Age=0; path=/`;
          const host = location.hostname.split(".");
          for (let i = 0; i < host.length - 1; i++)
            document.cookie = `${name}=; Max-Age=0; path=/; domain=.${host.slice(i).join(".")}`;
        }
      }
      if (hadConsent) location.reload();
    }
  }
  const controls = (
    <div className="consent-actions">
      <button
        type="button"
        className="button button-outline"
        onClick={() => choose("rejected")}
      >
        {cookiesTextos.rechazar}
      </button>
      <button
        type="button"
        className="button button-outline"
        onClick={() => choose("accepted")}
      >
        {cookiesTextos.aceptar}
      </button>
    </div>
  );
  if (settings)
    return (
      <div className="cookie-settings">
        <p>
          {cookiesTextos.actual}{" "}
          {choice === "accepted"
            ? cookiesTextos.aceptada
            : choice === "rejected"
              ? cookiesTextos.rechazada
              : cookiesTextos.ninguna}
          .
        </p>
        {!enabled && <p>{cookiesTextos.sinProveedores}</p>}
        {controls}
      </div>
    );
  return (
    <>
      {enabled && choice === null && (
        <aside className="cookie-banner" aria-label={cookiesTextos.titulo}>
          <h2>{cookiesTextos.titulo}</h2>
          <p>
            {cookiesTextos.texto}{" "}
            <Link href="/politica-cookies">{cookiesTextos.politica}</Link>.
          </p>
          {controls}
        </aside>
      )}
      {choice === "accepted" && (
        <>
          {/^G-[A-Z0-9]+$/.test(ga) && (
            <>
              <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
                strategy="afterInteractive"
              />
              <Script id="ga-init">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}</Script>
            </>
          )}
          {/^\d+$/.test(pixel) && (
            <Script id="meta-init">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>
          )}
        </>
      )}
    </>
  );
}
