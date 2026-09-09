import { z } from "zod";

/**
 * The contact enquiry's shape, shared by the browser and the route handler.
 *
 * The server is the only validator that matters — the browser's checks exist to
 * give people fast, in-place feedback, not to protect the endpoint. Keeping one
 * schema means the two can never drift into disagreeing about what is valid.
 *
 * Field names mirror the form definition in content/contact.ts exactly. Nothing
 * here is invented: every field is one the Contact page already renders.
 */

/** The inquiry categories offered by the form, and the only ones accepted. */
export const INQUIRY_TYPES = [
  "Scaffold evaluation or research",
  "Laboratory or technical support",
  "Investment",
  "Consortium",
  "Media or general inquiry",
  "Separate initiative in the Archive",
  "Other",
] as const;

/** Upper bounds. Generous for a person, far below anything worth storing. */
export const LIMITS = {
  fullName: 120,
  email: 254, // RFC 5321 maximum
  organisation: 160,
  subject: 200,
  message: 5000,
  profile: 500,
} as const;

/** Collapses whitespace and trims, so " a  b " and "a b" are the same value. */
const tidy = (v: unknown) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim() : v;

/** Trims but preserves newlines, for the free-text body. */
const tidyMultiline = (v: unknown) =>
  typeof v === "string" ? v.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trim() : v;

/** An optional text field: blank and absent are the same thing. */
const optionalText = (max: number) =>
  z.preprocess(
    (v) => {
      const t = tidy(v);
      return t === "" ? undefined : t;
    },
    z.string().max(max, "That value is too long.").optional(),
  );

export const contactSchema = z.object({
  fullName: z.preprocess(
    tidy,
    z
      .string()
      .min(2, "Please enter your name.")
      .max(LIMITS.fullName, "That name is too long."),
  ),
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z
      .string()
      .min(1, "Please enter your email address.")
      .max(LIMITS.email, "That email address is too long.")
      .email("Please enter a valid email address."),
  ),
  organisation: optionalText(LIMITS.organisation),
  inquiryType: z.enum(INQUIRY_TYPES, {
    message: "Please choose an inquiry type.",
  }),
  subject: z.preprocess(
    tidy,
    z
      .string()
      .min(3, "Please enter a subject.")
      .max(LIMITS.subject, "Please shorten the subject."),
  ),
  message: z.preprocess(
    tidyMultiline,
    z
      .string()
      .min(20, "Please give us a little more detail.")
      .max(LIMITS.message, "Your message is too long. Please shorten it."),
  ),
  profile: z.preprocess(
    (v) => {
      const t = tidy(v);
      if (t === "" || t === undefined) return undefined;
      // People habitually omit the scheme; accept that rather than reject it.
      return typeof t === "string" && !/^https?:\/\//i.test(t) ? `https://${t}` : t;
    },
    z
      .string()
      .max(LIMITS.profile, "That link is too long.")
      .url("Please enter a valid link, or leave this blank.")
      .optional(),
  ),
  consent: z.literal(true, {
    message: "Please provide consent to continue.",
  }),
  /**
   * Cloudflare Turnstile. Presence is checked here; validity is decided by
   * Cloudflare, server-side, in the route handler.
   */
  turnstileToken: z.string().min(1, "Please complete the verification.").max(4096),
  /**
   * Honeypot. Must be empty — a real person never sees this field, so anything
   * in it means an automated submission. The name is plausible enough for a bot
   * to fill but matches no browser autofill category, so a real visitor is
   * never offered a value for it ("company" would collide with address
   * autofill, and the form already has a real Organisation field).
   */
  companyWebsiteRef: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Field-keyed messages, which is what the form needs to render them in place. */
export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      out[key as keyof ContactInput] = issue.message;
    }
  }
  return out;
}

/** What the route handler returns, in both directions. */
export type ContactResponse =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: FieldErrors };
