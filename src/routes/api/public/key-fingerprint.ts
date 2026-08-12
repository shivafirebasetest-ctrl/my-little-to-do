import { createFileRoute } from "@tanstack/react-router";

/**
 * Testing-only endpoint that describes the SHAPE of LOVABLE_API_KEY.
 * The key value is never returned, logged, or included in any error.
 * Gated behind the DEBUG_TOKEN secret; unauthorized callers get a bare 404.
 */

function classify(value: string): string {
  return value.replace(/[A-Za-z]/g, "a").replace(/[0-9]/g, "9");
}

export const Route = createFileRoute("/api/public/key-fingerprint")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const debugToken = process.env["DEBUG_TOKEN"];
        const provided = request.headers.get("x-debug-token");

        if (!debugToken || !provided || provided !== debugToken) {
          return new Response(null, { status: 404 });
        }

        const key = process.env["LOVABLE_API_KEY"] ?? "";
        const present = typeof key === "string" && key.length > 0;

        if (!present) {
          return Response.json({
            present: false,
            length: 0,
            prefixClasses: null,
            charset: [],
            segments: [],
            looksLikeJWT: false,
          });
        }

        const classes = classify(key);

        return Response.json({
          present: true,
          length: key.length,
          // Character CLASSES of the first 8 chars, not the characters themselves.
          prefixClasses: classes.slice(0, 8),
          charset: Array.from(new Set(classes.split(""))).sort(),
          segments: key.split(/[._-]/).map((part) => part.length),
          looksLikeJWT: key.split(".").length === 3,
        });
      },
    },
  },
});
