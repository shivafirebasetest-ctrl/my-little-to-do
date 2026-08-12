import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type CheckResult = {
  name: string;
  ok: boolean;
  status?: number;
  detail: string;
};

/**
 * Verifies that this project's LOVABLE_API_KEY is live, by calling the
 * Lovable gateways from the server runtime. The key value itself is never
 * returned to the browser — only pass/fail plus the gateway's status text.
 */
export const checkLovableApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<{ checks: CheckResult[] }> => {
    const key = process.env["LOVABLE_API_KEY"];
    const checks: CheckResult[] = [];

    if (!key) {
      return {
        checks: [
          {
            name: "Key present in server runtime",
            ok: false,
            detail: "LOVABLE_API_KEY is not set. It needs to be provisioned for this project.",
          },
        ],
      };
    }

    checks.push({
      name: "Key present in server runtime",
      ok: true,
      detail: `Configured (${key.length} characters, value hidden).`,
    });

    // 1. AI Gateway — smallest possible authenticated call.
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: "Reply with the single word: ok" }],
          max_tokens: 5,
        }),
      });
      const body = await res.text();
      checks.push({
        name: "AI Gateway accepts the key",
        ok: res.ok,
        status: res.status,
        detail: res.ok ? "Authenticated and got a model response." : body.slice(0, 400),
      });
    } catch (error) {
      checks.push({
        name: "AI Gateway accepts the key",
        ok: false,
        detail: error instanceof Error ? error.message : "Request failed.",
      });
    }

    // 2. Connector Gateway — credential verification.
    // Needs a linked connector connection key alongside LOVABLE_API_KEY.
    const connectionKeyName = Object.keys(process.env).find(
      (name) => name.endsWith("_API_KEY") && name !== "LOVABLE_API_KEY",
    );
    const connectionKey = connectionKeyName ? process.env[connectionKeyName] : undefined;

    if (!connectionKey) {
      checks.push({
        name: "Connector Gateway credential check",
        ok: false,
        detail:
          "Skipped — no connector is linked to this project yet, so there is no connection key to verify. Link a connector (Slack, GitHub, Notion, …) and this check will run.",
      });
    } else {
      try {
        const res = await fetch("https://connector-gateway.lovable.dev/api/v1/verify_credentials", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "X-Connection-Api-Key": connectionKey,
          },
        });
        const body = await res.text();
        checks.push({
          name: `Connector Gateway credential check (${connectionKeyName})`,
          ok: res.ok,
          status: res.status,
          detail: body.slice(0, 400),
        });
      } catch (error) {
        checks.push({
          name: "Connector Gateway credential check",
          ok: false,
          detail: error instanceof Error ? error.message : "Request failed.",
        });
      }
    }

    return { checks };
  });
