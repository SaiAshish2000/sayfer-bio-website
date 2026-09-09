import { NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32_000;

const GENERIC_ERROR =
  "We could not submit your expression of interest. Please try again.";

const UNAVAILABLE =
  "The consortium expression-of-interest form is temporarily unavailable. Please try again later.";

const allowedCategories = new Set([
  "Research / academia",
  "Cultivated-meat company",
  "Supplier / service provider",
  "Food industry",
  "Safety / regulatory",
  "Investor / ecosystem",
  "Independent contributor",
  "Other",
]);

const allowedInterests = new Set([
  "Research and evaluation",
  "Laboratory and technical access",
  "Materials and process development",
  "Skills and knowledge exchange",
  "Evidence-based communication",
  "Responsible development",
]);

type ConsortiumInput = {
  fullName: string;
  email: string;
  organisation: string;
  role: string;
  country: string;
  location: string;
  category: string;
  interests: string[];
  contribution: string;
  profile: string;
  consent: boolean;
  updates: boolean;
  turnstileToken: string;
  companyWebsiteRef: string;
};

function fail(
  status: number,
  error: string,
  fieldErrors?: Record<string, string>,
) {
  return NextResponse.json(
    fieldErrors
      ? { ok: false, error, fieldErrors }
      : { ok: false, error },
    { status },
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validHttpUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]!,
  );

function emailText(data: ConsortiumInput) {
  return [
    "New Sayfer Bio consortium expression of interest",
    "",
    `Name:\n${data.fullName}`,
    "",
    `Email:\n${data.email}`,
    "",
    `Organisation / affiliation:\n${data.organisation || "Not provided"}`,
    "",
    `Role / area of work:\n${data.role || "Not provided"}`,
    "",
    `Country:\n${data.country}`,
    "",
    `City / state:\n${data.location || "Not provided"}`,
    "",
    `Participant category:\n${data.category}`,
    "",
    `Areas of interest:\n${data.interests.join(", ")}`,
    "",
    `Potential contribution:\n${data.contribution}`,
    "",
    `Website / professional profile:\n${data.profile || "Not provided"}`,
    "",
    "Consent given: yes",
    `Future consortium updates requested: ${data.updates ? "yes" : "no"}`,
    "",
    "—",
    "Submitted from: Sayfer Bio consortium expression-of-interest form",
  ].join("\n");
}

function emailHtml(data: ConsortiumInput) {
  const row = (label: string, value: string, multiline = false) => `
    <tr>
      <td style="
        width:34%;
        padding:12px 0;
        border-bottom:1px solid #e5e5e5;
        vertical-align:top;
        font-size:12px;
        letter-spacing:.08em;
        text-transform:uppercase;
        color:#666;
      ">
        ${escapeHtml(label)}
      </td>
      <td style="
        padding:12px 0;
        border-bottom:1px solid #e5e5e5;
        font-size:14px;
        line-height:1.6;
        color:#111;
        ${multiline ? "white-space:pre-wrap;" : ""}
      ">
        ${escapeHtml(value)}
      </td>
    </tr>
  `;

  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#f4f4f1;font-family:Arial,sans-serif;">
        <div style="max-width:720px;margin:0 auto;padding:40px 20px;">
          <div style="background:#fff;border:1px solid #ddd;padding:30px;">
            <h2 style="margin:0 0 8px;font-size:22px;color:#111;">
              New Sayfer Bio consortium expression of interest
            </h2>

            <p style="margin:0 0 28px;color:#666;font-size:14px;">
              Submitted from the Sayfer Bio website.
            </p>

            <table
              role="presentation"
              style="width:100%;border-collapse:collapse;"
            >
              ${row("Name", data.fullName)}
              ${row("Email", data.email)}
              ${row(
                "Organisation / affiliation",
                data.organisation || "Not provided",
              )}
              ${row("Role / area of work", data.role || "Not provided")}
              ${row("Country", data.country)}
              ${row("City / state", data.location || "Not provided")}
              ${row("Participant category", data.category)}
              ${row("Areas of interest", data.interests.join(", "))}
              ${row("Potential contribution", data.contribution, true)}
              ${row(
                "Website / profile",
                data.profile || "Not provided",
              )}
              ${row("Consent", "Yes")}
              ${row(
                "Future consortium updates",
                data.updates ? "Yes" : "No",
              )}
            </table>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.includes("application/json")
  ) {
    return fail(415, GENERIC_ERROR);
  }

  let raw: string;

  try {
    raw = await request.text();
  } catch {
    return fail(400, GENERIC_ERROR);
  }

  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return fail(413, GENERIC_ERROR);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return fail(400, GENERIC_ERROR);
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return fail(400, GENERIC_ERROR);
  }

  const body = parsed as Record<string, unknown>;

  const data: ConsortiumInput = {
    fullName: stringValue(body.fullName),
    email: stringValue(body.email),
    organisation: stringValue(body.organisation),
    role: stringValue(body.role),
    country: stringValue(body.country),
    location: stringValue(body.location),
    category: stringValue(body.category),
    interests: Array.isArray(body.interests)
      ? body.interests.map(stringValue).filter(Boolean)
      : [],
    contribution: stringValue(body.contribution),
    profile: stringValue(body.profile),
    consent: body.consent === true,
    updates: body.updates === true,
    turnstileToken: stringValue(body.turnstileToken),
    companyWebsiteRef: stringValue(body.companyWebsiteRef),
  };

  // Honeypot: silently accept bot submissions without sending email.
  if (data.companyWebsiteRef) {
    return NextResponse.json({ ok: true });
  }

  const fieldErrors: Record<string, string> = {};

  if (!data.fullName || data.fullName.length > 120) {
    fieldErrors.fullName = "Please enter your full name.";
  }

  if (
    !data.email ||
    data.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    fieldErrors.email = "Please enter a valid email address.";
  }

  if (!data.country || data.country.length > 100) {
    fieldErrors.country = "Please enter your country.";
  }

  if (!allowedCategories.has(data.category)) {
    fieldErrors.category =
      "Please select a participant category.";
  }

  if (
    data.interests.length === 0 ||
    data.interests.some(
      (interest) => !allowedInterests.has(interest),
    )
  ) {
    fieldErrors.interests =
      "Please select at least one valid area of interest.";
  }

  if (!data.contribution || data.contribution.length > 4000) {
    fieldErrors.contribution =
      "Please describe your potential contribution.";
  }

  if (data.organisation.length > 160) {
    fieldErrors.organisation = "Please shorten this field.";
  }

  if (data.role.length > 160) {
    fieldErrors.role = "Please shorten this field.";
  }

  if (data.location.length > 160) {
    fieldErrors.location = "Please shorten this field.";
  }

  if (
    data.profile &&
    (data.profile.length > 500 || !validHttpUrl(data.profile))
  ) {
    fieldErrors.profile = "Please enter a valid website URL.";
  }

  if (!data.consent) {
    fieldErrors.consent = "Please confirm your consent.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fail(400, GENERIC_ERROR, fieldErrors);
  }

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim() ??
    undefined;

  const turnstile = await verifyTurnstile(
    data.turnstileToken,
    ip,
  );

  if (!turnstile.ok) {
    if (turnstile.reason === "unconfigured") {
      console.error(
        "[consortium] TURNSTILE_SECRET_KEY is not configured.",
      );

      return fail(503, UNAVAILABLE);
    }

    if (turnstile.reason === "unreachable") {
      console.error(
        "[consortium] Turnstile verification could not be reached.",
      );

      return fail(502, GENERIC_ERROR);
    }

    return fail(
      400,
      "Verification failed. Please try the check again.",
      {
        turnstileToken:
          "Verification failed. Please try again.",
      },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.error(
      "[consortium] Missing email configuration.",
    );

    return fail(503, UNAVAILABLE);
  }

  try {
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: data.email,
      subject: `New Sayfer Bio consortium expression of interest — ${data.fullName}`,
      text: emailText(data),
      html: emailHtml(data),
    });

    if (error) {
      console.error(
        "[consortium] Resend rejected the message:",
        error.message,
      );

      return fail(502, GENERIC_ERROR);
    }
  } catch (error) {
    console.error(
      "[consortium] Unexpected email failure:",
      error instanceof Error
        ? error.message
        : "unknown error",
    );

    return fail(500, GENERIC_ERROR);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed",
    },
    {
      status: 405,
    },
  );
}