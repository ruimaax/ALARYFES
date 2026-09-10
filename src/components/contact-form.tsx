"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { privacidadBasica } from "@/data/legal";
import { sitio } from "@/data/sitio";
import { planes } from "@/data/planes";
import { validateContact } from "@/lib/contact-validation";
import { track } from "@/lib/analytics";
export function ContactForm({
  referral = false,
  selectedPlan = "",
}: {
  referral?: boolean;
  selectedPlan?: string;
}) {
  // El plan llega por ?plan= en la URL. Se lee en el navegador para que la
  // página pueda servirse estática.
  const [plan, setPlan] = useState(selectedPlan);
  useEffect(() => {
    if (selectedPlan) return;
    const enUrl = new URLSearchParams(location.search).get("plan");
    if (enUrl && planes.some((p) => p.slug === enUrl)) setPlan(enUrl);
  }, [selectedPlan]);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "pending" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const prefix = referral ? "refer" : "contact";
  const field = (
    name: string,
    label: string,
    type = "text",
    maxLength = 160,
  ) => (
    <div className="field">
      <label htmlFor={`${prefix}-${name}`}>{label} *</label>
      <input
        id={`${prefix}-${name}`}
        name={name}
        type={type}
        required
        maxLength={maxLength}
        autoComplete={
          name === "nombre"
            ? "name"
            : name === "telefono"
              ? "tel"
              : name === "negocio"
                ? "organization"
                : "off"
        }
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${prefix}-${name}-error` : undefined}
      />
      <FieldError name={name} errors={errors} prefix={prefix} />
    </div>
  );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const values = {
      ...Object.fromEntries(fd),
      tipo: referral ? "recomendacion" : "contacto",
      consentimiento: fd.get("consentimiento") === "on",
    };
    const validation = validateContact(values);
    if (!validation.ok) {
      setErrors(validation.errors);
      setStatus("error");
      setMessage(sitio.contacto.validacion);
      const first = Object.keys(validation.errors)[0];
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setErrors({});
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(15000),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setErrors(payload.errors || {});
        throw new Error(payload.message || sitio.contacto.error);
      }
      const pending = payload.status === "pending_configuration";
      setStatus(pending ? "pending" : "success");
      setMessage(payload.message || sitio.contacto.enviado);
      if (!pending) {
        track("Contacto", { tipo: values.tipo });
        form.reset();
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error &&
          !["TimeoutError", "AbortError"].includes(error.name)
          ? error.message
          : sitio.contacto.error,
      );
    }
  }
  return (
    <form
      className="contact-form"
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-busy={status === "loading"}
    >
      <p className="form-required">{sitio.contacto.requerido}</p>
      <div className="form-grid">
        {field("nombre", sitio.contacto.nombre, "text", 100)}
        {field("negocio", sitio.contacto.negocio)}
        {referral ? (
          <>
            {field("referidoNegocio", sitio.contacto.referidoNegocio)}
            {field("referidoContacto", sitio.contacto.referidoContacto)}
          </>
        ) : (
          <>
            {field("telefono", sitio.contacto.telefono, "tel", 25)}
            {field("sector", sitio.contacto.sector)}
            <div className="field full">
              <label htmlFor={`${prefix}-plan`}>{sitio.contacto.plan}</label>
              <select
                name="plan"
                id={`${prefix}-plan`}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              >
                <option value="">{sitio.contacto.sinPlan}</option>
                {planes.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label htmlFor={`${prefix}-mensaje`}>
                {sitio.contacto.mensaje} *
              </label>
              <textarea
                id={`${prefix}-mensaje`}
                name="mensaje"
                rows={4}
                required
                maxLength={3000}
                aria-invalid={!!errors.mensaje}
                aria-describedby={
                  errors.mensaje ? `${prefix}-mensaje-error` : undefined
                }
              />
              <FieldError name="mensaje" errors={errors} prefix={prefix} />
            </div>
          </>
        )}
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={`${prefix}-website`}>Website</label>
        <input
          id={`${prefix}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <label className="consent">
        <input
          type="checkbox"
          name="consentimiento"
          required
          aria-invalid={!!errors.consentimiento}
          aria-describedby={
            errors.consentimiento ? `${prefix}-consentimiento-error` : undefined
          }
        />
        <span>
          {referral
            ? sitio.contacto.referidoConsentimiento
            : sitio.contacto.consentimiento}{" "}
          <Link href="/politica-privacidad">{sitio.legales[1].titulo}</Link>.
        </span>
      </label>
      <FieldError name="consentimiento" errors={errors} prefix={prefix} />
      <div className="privacy-basic">
        <p>
          {privacidadBasica.responsable} {privacidadBasica.finalidad}
        </p>
        <p>
          {privacidadBasica.destinatarios} {privacidadBasica.derechos}{" "}
          <Link href="/politica-privacidad">{privacidadBasica.enlace}</Link>.
        </p>
      </div>
      <button
        className="button button-gold"
        type="submit"
        disabled={status === "loading" || status === "success"}
      >
        {status === "loading"
          ? sitio.contacto.carga
          : referral
            ? sitio.acciones.recomendar
            : sitio.acciones.enviar}
      </button>
      <div className={`form-status ${status}`} role="status" aria-live="polite">
        {message}
      </div>
    </form>
  );
}
function FieldError({
  name,
  errors,
  prefix,
}: {
  name: string;
  errors: Record<string, string>;
  prefix: string;
}) {
  return errors[name] ? (
    <p className="field-error" id={`${prefix}-${name}-error`}>
      {errors[name]}
    </p>
  ) : null;
}
