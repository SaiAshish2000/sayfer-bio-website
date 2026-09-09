import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  contactSchema,
  fieldErrorsFrom,
  type ContactInput,
  type ContactResponse,
  type FieldErrors,
} from "@/lib/contact-schema";
import { verifyTurnstile } from "@/lib/turnstile";

/**
 * Contact enquiry endpoint.
 *
 * Order matters here, and it is cheapest-first on purpose: shape, then size,
 * then schema, then the honeypot, then the network call to Cloudflare, and only
 * then Resend. Nothing reaches an external service until the payload has earned
 * it.
 *
 * Every failure returns a short, generic message. The client is never told
 * which provider failed, what a key looks like, or what an exception said —
 * that detail goes to the server log and nowhere else.
 */

export const runtime = "nodejs";
/** Never cached, never statically evaluated at build time. */
export const dynamic = "force-dynamic";

/** Enough for the longest legitimate enquiry with room to spare. */
const MAX_BODY_BYTES = 32_000;

const GENERIC_ERROR =
  "We could not submit your inquiry. Please try again in a moment.";
const UNAVAILABLE =
  "The inquiry form is temporarily unavailable. Please try again later.";

function fail(status: number, error: string, fieldErrors?: FieldErrors) {
  return NextResponse.json<ContactResponse>(
    fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error },
    { status },
  );
}

/** Plain-text body. Kept plain so it is readable in any mail client. */
function emailText(d: ContactInput) {
  return [
    "New Sayfer Bio website enquiry",
    "",
    `Name:\n${d.fullName}`,
    "",
    `Email:\n${d.email}`,
    "",
    `Organisation:\n${d.organisation ?? "Not provided"}`,
    "",
    `Inquiry type:\n${d.inquiryType}`,
    "",
    `Subject:\n${d.subject}`,
    "",
    `Message:\n${d.message}`,
    "",
    `Website or profile:\n${d.profile ?? "Not provided"}`,
    "",
    "—",
    "Submitted from: Sayfer Bio website contact form",
    `Consent given: yes`,
  ].join("\n");
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/**
 * HTML body. Every interpolated value is escaped: the content is attacker
 * controlled, and it is being rendered in someone's mail client.
 */
function emailHtml(d: ContactInput) {
  const row = (label: string, value: string, pre = false) => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #e6e6e2;vertical-align:top;width:170px;
                 font:600 12px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;
                 letter-spacing:.06em;text-transform:uppercase;color:#6b7280;">${label}</td>
      <td style="padding:14px 0;border-bottom:1px solid #e6e6e2;
                 font:400 14px/1.65 -apple-system,Segoe UI,Roboto,sans-serif;color:#111827;
                 ${pre ? "white-space:pre-wrap;" : ""}">${escapeHtml(value)}</td>
    </tr>`;

  return `<!doctype html><html><body style="margin:0;background:#f6f6f4;padding:28px;">
    <table role="presentation" cellpadding="0" cellspacing="0"
           style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e6e6e2;border-radius:10px;">
      <tr><td style="padding:26px 30px 6px;">
        <p style="margin:0;font:600 16px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#111827;">
          New Sayfer Bio website enquiry</p>
        <p style="margin:6px 0 0;font:400 13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#6b7280;">
          Submitted from the Sayfer Bio website contact form.</p>
      </td></tr>
      <tr><td style="padding:8px 30px 26px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          ${row("Name", d.fullName)}
          ${row("Email", d.email)}
          ${row("Organisation", d.organisation ?? "Not provided")}
          ${row("Inquiry type", d.inquiryType)}
          ${row("Subject", d.subject)}
          ${row("Message", d.message, true)}
          ${row("Website / profile", d.profile ?? "Not provided")}
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

export async function POST(request: Request) {
  // --- shape and size ------------------------------------------------------
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return fail(415, GENERIC_ERROR);
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return fail(413, GENERIC_ERROR);

  const raw = await request.text();
  // content-length can be absent or wrong; the actual bytes are what count.
  if (raw.length > MAX_BODY_BYTES) return fail(413, GENERIC_ERROR);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail(400, GENERIC_ERROR);
  }

  // --- schema --------------------------------------------------------------
  const result = contactSchema.safeParse(parsed);
  if (!result.success) {
    return fail(
      400,
      "Please check the highlighted fields and try again.",
      fieldErrorsFrom(result.error),
    );
  }
  const data = result.data;

  // --- honeypot ------------------------------------------------------------
  // Answer exactly as we would on success. Telling a bot which check caught it
  // is just free tuning information, and no person can reach this branch: the
  // field is hidden from layout, from assistive technology and from the tab
  // order, with autocomplete disabled.
  if (data.companyWebsiteRef && data.companyWebsiteRef.trim() !== "") {
    return NextResponse.json<ContactResponse>({ ok: true });
  }

  // --- Turnstile, server-side ----------------------------------------------
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined;

  const turnstile = await verifyTurnstile(data.turnstileToken, ip);
  if (!turnstile.ok) {
    if (turnstile.reason === "unconfigured") {
      console.error(
        "[contact] TURNSTILE_SECRET_KEY is not set; refusing to accept submissions.",
      );
      return fail(503, UNAVAILABLE);
    }
    if (turnstile.reason === "unreachable") {
      console.error("[contact] Turnstile verification could not be reached.");
      return fail(502, GENERIC_ERROR);
    }
    return fail(400, "Verification failed. Please try the check again.", {
      turnstileToken: "Verification failed. Please try again.",
    });
  }

  // --- delivery ------------------------------------------------------------
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    console.error(
      "[contact] Missing email configuration:",
      [
        !apiKey && "RESEND_API_KEY",
        !to && "CONTACT_TO_EMAIL",
        !from && "CONTACT_FROM_EMAIL",
      ]
        .filter(Boolean)
        .join(", "),
    );
    return fail(503, UNAVAILABLE);
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      // The visitor is never the sender: their domain has not authorised us to
      // send on its behalf, and doing so fails SPF/DKIM and lands in spam.
      // Reply-To gets the same convenience without the deliverability cost.
      replyTo: data.email,
      subject: `[${data.inquiryType}] ${data.subject}`,
      text: emailText(data),
      html: emailHtml(data),
    });

    if (error) {
      // Log the provider's message; return none of it.
      console.error("[contact] Resend rejected the message:", error.message);
      return fail(502, GENERIC_ERROR);
    }
  } catch (err) {
    console.error(
      "[contact] Unexpected failure while sending:",
      err instanceof Error ? err.message : "unknown error",
    );
    return fail(500, GENERIC_ERROR);
  }

  return NextResponse.json<ContactResponse>({ ok: true });
}

/** Anything other than POST is not part of this endpoint's contract. */
export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
