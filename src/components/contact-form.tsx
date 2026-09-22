"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sitio } from "@/data/sitio";
import { planes } from "@/data/planes";
import { validateContact } from "@/lib/contact-validation";
import { track } from "@/lib/analytics";
import { StarBorder } from "./star-border";
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
  // Progreso: cuántos campos obligatorios están completos.
  const [progreso, setProgreso] = useState({ hechos: 0, total: 0 });
  const [caracteres, setCaracteres] = useState(0);
  const medir = () => {
    const form = formRef.current;
    if (!form) return;
    const campos = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input[required], textarea[required]",
      ),
    );
    const hechos = campos.filter((c) =>
      c.type === "checkbox" ? (c as HTMLInputElement).checked : c.value.trim(),
    ).length;
    setProgreso({ hechos, total: campos.length });
    const mensaje = form.elements.namedItem("mensaje");
    setCaracteres(mensaje instanceof HTMLTextAreaElement ? mensaje.value.length : 0);
  };
  useEffect(medir, []);
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
      const campo = form.elements.namedItem(first);
      if (campo instanceof HTMLElement) campo.focus();
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
        medir();
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
      id={`${prefix}-form`}
      className="contact-form"
      ref={formRef}
      onSubmit={submit}
      onInput={medir}
      onChange={medir}
      noValidate
      aria-busy={status === "loading"}
    >
      <p className="form-required">{sitio.contacto.requerido}</p>
      <div
        className="form-progress"
        style={
          {
            "--progress": progreso.total ? progreso.hechos / progreso.total : 0,
          } as React.CSSProperties
        }
        data-complete={progreso.total > 0 && progreso.hechos === progreso.total}
        aria-hidden="true"
      >
        <i />
        <span>
          {progreso.hechos}/{progreso.total}
        </span>
      </div>
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
            <fieldset className="field full plan-chips">
              <legend>{sitio.contacto.plan}</legend>
              <div>
                {[{ slug: "", nombre: sitio.contacto.sinPlan }, ...planes].map(
                  (p) => (
                    <label key={p.slug || "ninguno"}>
                      <input
                        type="radio"
                        name="plan"
                        value={p.slug}
                        checked={plan === p.slug}
                        onChange={() => setPlan(p.slug)}
                      />
                      <span>{p.nombre}</span>
                    </label>
                  ),
                )}
              </div>
            </fieldset>
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
              <span className="field-count" aria-hidden="true">
                {caracteres}/3000
              </span>
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
      <StarBorder
        className="button button-gold"
        type="submit"
        disabled={status === "loading" || status === "success"}
      >
        {status === "loading"
          ? sitio.contacto.carga
          : referral
            ? sitio.acciones.recomendar
            : sitio.acciones.enviar}
      </StarBorder>
      <div className={`form-status ${status}`} role="status" aria-live="polite">
        {status === "success" && (
          <svg className="form-check" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10.5" pathLength={100} />
            <path d="m7 12.5 3.2 3.2L17 9" pathLength={100} />
          </svg>
        )}
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
