"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Turnstile, resetTurnstile } from "./Turnstile";
import type { ContactResponse, FieldErrors } from "@/lib/contact-schema";

/**
 * Presentational forms with client-side validation and full interaction states.
 *
 * Submission is OPT-IN, via the `submit` prop. A form given one posts JSON to
 * its endpoint and runs the real idle -> submitting -> success/error cycle; a
 * form without one keeps the previous behaviour and reports that it is not
 * connected rather than showing a false success. The Contact page is wired; the
 * Consortium expression-of-interest form is deliberately left as it was.
 */

export type Field = {
  name: string;
  label: string;
  required: boolean;
  type: "text" | "email" | "url" | "textarea" | "select" | "checkboxes";
  help?: string;
  options?: string[];
};

/** Everything a wired-up form needs in order to actually submit. */
export type SubmitConfig = {
  endpoint: string;
  /** Cloudflare Turnstile site key. Public by design. */
  turnstileSiteKey?: string;
  messages: { success: string; failure: string; unavailable: string };
};

type Status = "idle" | "submitting" | "success" | "error" | "notice";

const NOT_CONNECTED =
  "This form is not connected yet. Until it is, please reach the team through the contact details on the Contact page.";

const inputBase =
  "w-full rounded-md border border-hairline-strong bg-ground/70 px-3.5 py-2.5 text-sm text-ivory placeholder:text-faint focus-visible:border-accent-bright";

const noticeBase =
  "max-w-[62ch] rounded-md border px-4 py-3 text-sm leading-relaxed";

function FieldRow({
  field,
  error,
  disabled,
}: {
  field: Field;
  error?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const describedBy = [field.help ? `${id}-help` : null, error ? `${id}-err` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-ivory">
        {field.label}
        {field.required ? (
          <span className="text-muted"> (required)</span>
        ) : (
          <span className="text-faint"> (optional)</span>
        )}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.name}
          required={field.required}
          disabled={disabled}
          rows={5}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={inputBase}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          name={field.name}
          required={field.required}
          disabled={disabled}
          defaultValue=""
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={inputBase}
        >
          <option value="" disabled>
            Select an option
          </option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "checkboxes" ? (
        <fieldset
          id={id}
          aria-describedby={describedBy || undefined}
          className="grid gap-2 sm:grid-cols-2"
        >
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-mist">
              <input
                type="checkbox"
                name={field.name}
                value={o}
                disabled={disabled}
                className="accent-accent"
              />
              {o}
            </label>
          ))}
        </fieldset>
      ) : (
        <input
          id={id}
          name={field.name}
          type={field.type}
          required={field.required}
          disabled={disabled}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={inputBase}
        />
      )}

      {field.help ? (
        <p id={`${id}-help`} className="text-xs leading-relaxed text-muted">
          {field.help}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-accent-bright">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The honeypot.
 *
 * Removed from the tab order, from the accessibility tree and from the visual
 * flow, with autofill switched off — so no person and no screen reader ever
 * meets it, and nothing but an automated form-filler can put a value in it.
 * `position:absolute` with zero size keeps it out of layout entirely, which
 * `display:none` would also do but which some bots specifically skip.
 */
function Honeypot({ disabled }: { disabled?: boolean }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        overflow: "hidden",
        clip: "rect(0 0 0 0)",
        whiteSpace: "nowrap",
      }}
    >
      <label htmlFor="companyWebsiteRef">Do not fill this in</label>
      <input
        id="companyWebsiteRef"
        name="companyWebsiteRef"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        disabled={disabled}
        defaultValue=""
      />
    </div>
  );
}

export function DataForm({
  fields,
  consent,
  updates,
  submitLabel,
  beforeSubmitNote,
  submit,
}: {
  fields: Field[];
  consent: string;
  updates?: string;
  submitLabel: string;
  beforeSubmitNote?: string;
  submit?: SubmitConfig;
}) {
  const [errors, setErrors] = useState<FieldErrors & Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [widgetFailed, setWidgetFailed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const wired = Boolean(submit);
  const needsTurnstile = Boolean(submit?.turnstileSiteKey);
  const busy = status === "submitting";

  /** The browser-side pass. Fast feedback only; the server re-checks all of it. */
  function localErrors(data: FormData) {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (f.type === "checkboxes") {
        if (f.required && data.getAll(f.name).length === 0)
          next[f.name] = "Please select at least one option.";
        continue;
      }
      const v = String(data.get(f.name) ?? "").trim();
      if (f.required && !v) {
        next[f.name] = "Please complete this field.";
      } else if (v && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        next[f.name] = "Please enter a valid email address.";
      }
    }
    if (!data.get("consent")) next.consent = "Please provide consent to continue.";
    return next;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Guards a double click and an Enter key arriving during a request.
    if (busy) return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const next = localErrors(data);

    if (!wired) {
      setErrors(next);
      setStatus(Object.keys(next).length === 0 ? "notice" : "idle");
      return;
    }

    if (needsTurnstile && !token) {
      next.turnstileToken = widgetFailed
        ? "The verification could not load. Please refresh and try again."
        : "Please complete the verification below.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      setStatus("idle");
      setMessage("");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const payload: Record<string, unknown> = {
      turnstileToken: token ?? "",
      companyWebsiteRef: String(data.get("companyWebsiteRef") ?? ""),
      consent: Boolean(data.get("consent")),
    };
    if (updates) {
  payload.updates = Boolean(data.get("updates"));
}
    for (const f of fields) {
      payload[f.name] =
        f.type === "checkboxes"
          ? data.getAll(f.name).map(String)
          : String(data.get(f.name) ?? "");
    }

    try {
      const res = await fetch(submit!.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      let body: ContactResponse | null = null;
      try {
        body = (await res.json()) as ContactResponse;
      } catch {
        body = null;
      }

      if (res.ok && body?.ok) {
        // Only a confirmed delivery clears the form.
        form.reset();
        setErrors({});
        setToken(null);
        resetTurnstile();
        setStatus("success");
        setMessage(submit!.messages.success);
        return;
      }

      // Anything else is a failure: the input stays exactly where the visitor
      // left it, and the challenge is reset so a retry can get a fresh token.
      const failure =
        body && !body.ok
          ? body.error
          : res.status === 503
            ? submit!.messages.unavailable
            : submit!.messages.failure;
      if (body && !body.ok && body.fieldErrors) {
        setErrors(body.fieldErrors as Record<string, string>);
      }
      setToken(null);
      resetTurnstile();
      setStatus("error");
      setMessage(failure);
    } catch {
      // Network-level failure: offline, DNS, aborted.
      setToken(null);
      resetTurnstile();
      setStatus("error");
      setMessage(submit!.messages.failure);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="relative mt-10 flex flex-col gap-7"
    >
      {beforeSubmitNote ? (
        <p className="max-w-[62ch] text-xs leading-relaxed text-muted">
          {beforeSubmitNote}
        </p>
      ) : null}

      {fields.map((f) => (
        <FieldRow key={f.name} field={f} error={errors[f.name]} disabled={busy} />
      ))}

      {wired ? <Honeypot disabled={busy} /> : null}

      <label className="flex items-start gap-3 text-sm leading-relaxed text-mist">
        <input
          type="checkbox"
          name="consent"
          disabled={busy}
          className="mt-1 accent-accent"
        />
        <span>{consent}</span>
      </label>
      {errors.consent ? (
        <p className="-mt-4 text-xs text-accent-bright">{errors.consent}</p>
      ) : null}

      {updates ? (
        <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
          <input
            type="checkbox"
            name="updates"
            disabled={busy}
            className="mt-1 accent-accent"
          />
          <span>{updates}</span>
        </label>
      ) : null}

      {needsTurnstile ? (
        <div className="flex flex-col gap-2">
          <Turnstile
            siteKey={submit!.turnstileSiteKey!}
            onToken={(t) => {
              setToken(t);
              if (t) {
                setWidgetFailed(false);
                setErrors((p) => {
                  if (!p.turnstileToken) return p;
                  const rest = { ...p };
                  delete rest.turnstileToken;
                  return rest;
                });
              }
            }}
            onError={() => setWidgetFailed(true)}
          />
          {errors.turnstileToken ? (
            <p className="text-xs text-accent-bright">{errors.turnstileToken}</p>
          ) : null}
        </div>
      ) : wired ? (
        <p className={`${noticeBase} border-hairline-strong bg-ground/60 text-muted`}>
          Spam protection is not configured for this environment, so the form
          cannot be submitted from here.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy || (wired && !needsTurnstile)}
          aria-busy={busy || undefined}
          className="rounded-full bg-ivory px-5 py-2.5 text-sm font-medium text-void transition-transform active:translate-y-px hover:bg-accent-bright disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-ivory"
        >
          {busy ? "Sending…" : submitLabel}
        </button>
        {Object.keys(errors).length > 0 ? (
          <span className="text-xs text-accent-bright">
            Please complete the required fields.
          </span>
        ) : null}
      </div>

      {/* One live region for every outcome, so a status change is announced
          once and the block below the button never shifts the fields above it. */}
      <div aria-live="polite" aria-atomic="true">
        {status === "notice" ? (
          <p className={`${noticeBase} border-hairline-strong bg-ground/60 text-mist`}>
            {NOT_CONNECTED}
          </p>
        ) : null}
        {status === "success" ? (
          <p className={`${noticeBase} border-accent bg-accent-deep/20 text-ivory`}>
            {message}
          </p>
        ) : null}
        {status === "error" ? (
          <p
            role="alert"
            className={`${noticeBase} border-hairline-strong bg-ground/60 text-mist`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
