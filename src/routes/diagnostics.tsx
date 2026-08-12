import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { checkLovableApiKey } from "@/lib/diagnostics.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/diagnostics")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gateway diagnostics — My Little To-Do" },
      {
        name: "description",
        content:
          "Verify that this project's Lovable API key is live against the AI Gateway and Connector Gateway.",
      },
      { property: "og:title", content: "Gateway diagnostics — My Little To-Do" },
      {
        property: "og:description",
        content: "Check the project's Lovable API key against the AI and Connector gateways.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiagnosticsPage,
});

function DiagnosticsPage() {
  const run = useServerFn(checkLovableApiKey);
  const mutation = useMutation({ mutationFn: () => run({}) });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Gateway diagnostics</h1>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">Back to tasks</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verify the project key</CardTitle>
          <CardDescription>
            Runs from the server: an authenticated call to the AI Gateway, plus a credential check
            against the Connector Gateway. The key value itself is never sent to the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Checking…" : "Run checks"}
          </Button>

          {mutation.isError ? (
            <p className="text-sm text-destructive">
              {mutation.error instanceof Error ? mutation.error.message : "Check failed."}
            </p>
          ) : null}

          {mutation.data?.checks.map((check) => (
            <div key={check.name} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{check.name}</span>
                <Badge variant={check.ok ? "default" : "secondary"}>
                  {check.ok ? "OK" : "Failed"}
                  {check.status ? ` · ${check.status}` : ""}
                </Badge>
              </div>
              <p className="mt-2 break-words font-mono text-xs text-muted-foreground">
                {check.detail}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Rotating the key</CardTitle>
          <CardDescription>
            The key is a managed secret — its value is never displayed. Rotation replaces it and
            invalidates the old one within an hour.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Ask in chat: <span className="font-medium text-foreground">"rotate my LOVABLE_API_KEY"</span>{" "}
            — that triggers the managed rotation for this project.
          </p>
          <p>
            Then republish so the server runtime picks up the new value, and re-run the checks above
            to confirm it is live.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
