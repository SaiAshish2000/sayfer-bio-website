# Contact form — setup

The Contact page form posts to a Next.js route handler, which validates the
enquiry, verifies a Cloudflare Turnstile token server-side, and sends one
notification email via Resend. Nothing is stored in a database.

```
Contact page form
  → POST /api/contact          (app/api/contact/route.ts)
      → schema validation      (lib/contact-schema.ts, Zod)
      → honeypot check
      → Turnstile verify       (lib/turnstile.ts, server-side)
      → Resend send
```

## Environment variables

Set all five. Copy `.env.example` to `.env.local` for development, and add the
same names to the hosting provider's environment settings for production.
`.env.local` is gitignored; `.env.example` holds names and placeholders only.

| Variable | Where it is used | Exposed to the browser? |
| --- | --- | --- |
| `RESEND_API_KEY` | `app/api/contact/route.ts` — authenticates the send | **No** |
| `CONTACT_TO_EMAIL` | `app/api/contact/route.ts` — recipient. Production: `sai@sayferbio.com` | **No** |
| `CONTACT_FROM_EMAIL` | `app/api/contact/route.ts` — sender. Domain must be verified in Resend | **No** |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `app/contact/page.tsx` → the widget | Yes, by design |
| `TURNSTILE_SECRET_KEY` | `lib/turnstile.ts` — verifies the token with Cloudflare | **No** |

The recipient is read from the environment rather than hardcoded, so it can be
changed without editing application code.

## Deployment checklist

1. **Resend account** — create one, add an API key, put it in `RESEND_API_KEY`.
2. **Verify the sending domain.** Until `sayferbio.com` is verified in Resend,
   use their shared sender:
   `CONTACT_FROM_EMAIL="Sayfer Bio <onboarding@resend.dev>"`.
   That sender can only deliver to the address that owns the Resend account, so
   it is enough to prove the pipeline works but not to go live.
   Once the domain is verified (Resend supplies the DKIM/SPF DNS records),
   change it to e.g. `"Sayfer Bio <website@sayferbio.com>"`. **No code change is
   needed** — only the environment variable.
3. **Cloudflare Turnstile** — create a widget for the production hostname, then
   set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
4. **Set `CONTACT_TO_EMAIL`** to `sai@sayferbio.com`.
5. Redeploy so the new environment is picked up, then send one real test
   enquiry and confirm it arrives and that **Reply** goes to the visitor.

## Local development

`.env.example` documents Cloudflare's published dummy Turnstile keys, which are
not secrets and let the full path be exercised without a Cloudflare account —
including an always-blocks pair for testing the rejection branch.

Without a `RESEND_API_KEY` the endpoint returns *"The inquiry form is temporarily
unavailable"* and logs which variables are missing. That is deliberate: the form
never reports success for an email that was not sent.

## Behaviour worth knowing

- **Fails closed.** If `TURNSTILE_SECRET_KEY` is absent the endpoint refuses
  submissions instead of skipping verification, so a half-configured deployment
  cannot silently accept spam.
- **Reply-To, not From.** The sender is always `CONTACT_FROM_EMAIL`; the
  visitor's address is set as Reply-To. Sending *as* the visitor would fail
  SPF/DKIM and land in spam.
- **Honeypot.** A hidden `companyWebsiteRef` field. If filled, the endpoint
  returns the normal success shape without sending, so a bot learns nothing.
- **Errors are generic.** Provider messages, keys and stack traces go to the
  server log only; the browser gets a short human message.
- **No rate limiting.** Turnstile is the abuse control. If enquiry volume ever
  justifies more, add it then rather than now.

## Not included, by decision

- No database. Enquiries are email only. Persistent storage can be added later
  if the client actually wants it.
- The Consortium expression-of-interest form is **not** wired up — it still
  shows its "not connected" notice. Only the Contact form was in scope.
