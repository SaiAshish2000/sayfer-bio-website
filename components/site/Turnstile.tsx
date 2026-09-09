"use client";

import { useEffect, useId, useRef } from "react";

/**
 * The Cloudflare Turnstile widget.
 *
 * Renders explicitly rather than via Cloudflare's auto-scan, so the widget's
 * lifetime is tied to this component and the token is handed straight to the
 * form's state instead of being read back out of a hidden input.
 *
 * The token this produces is only a claim. It means nothing until the route
 * handler has verified it against the secret key (see lib/turnstile.ts).
 */

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: "auto" | "light" | "dark";
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onSayferTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Loads the Turnstile script once per document, shared by any widget. */
function loadTurnstile(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);

    const existing = document.getElementById(SCRIPT_ID);
    const onReady = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("turnstile unavailable"));
    };

    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile blocked")), {
        once: true,
      });
      return;
    }

    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener("load", onReady, { once: true });
    s.addEventListener("error", () => reject(new Error("turnstile blocked")), {
      once: true,
    });
    document.head.appendChild(s);
  });
}

export function Turnstile({
  siteKey,
  onToken,
  onError,
}: {
  siteKey: string;
  /** Called with a fresh token, or with null when it expires or errors. */
  onToken: (token: string | null) => void;
  onError?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const id = useId();

  // The callbacks are read through a ref so re-rendering the form does not tear
  // the widget down and put the visitor through the challenge again. Written in
  // an effect rather than during render, which is where refs are allowed to be
  // touched.
  const cb = useRef({ onToken, onError });
  useEffect(() => {
    cb.current = { onToken, onError };
  }, [onToken, onError]);

  useEffect(() => {
    let cancelled = false;
    const el = host.current;
    if (!el) return;

    loadTurnstile()
      .then((api) => {
        if (cancelled || !host.current) return;
        widgetId.current = api.render(host.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => cb.current.onToken(token),
          "expired-callback": () => cb.current.onToken(null),
          "error-callback": () => {
            cb.current.onToken(null);
            cb.current.onError?.();
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          cb.current.onToken(null);
          cb.current.onError?.();
        }
      });

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* the widget is already gone; nothing to clean up */
        }
      }
      widgetId.current = null;
    };
  }, [siteKey]);

  return <div ref={host} id={id} className="min-h-[65px]" />;
}

/** Resets the visible widget so a new token can be issued after a failure. */
export function resetTurnstile() {
  try {
    window.turnstile?.reset();
  } catch {
    /* nothing rendered yet */
  }
}
