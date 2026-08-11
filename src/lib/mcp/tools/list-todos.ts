import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_todos",
  title: "List tasks",
  description: "List the signed-in user's tasks, optionally filtered by completion state.",
  inputSchema: {
    status: z
      .enum(["all", "active", "completed"])
      .optional()
      .describe("Which tasks to return. Defaults to all."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("todos")
      .select("id, text, completed, created_at")
      .order("created_at", { ascending: false });
    if (status === "active") query = query.eq("completed", false);
    if (status === "completed") query = query.eq("completed", true);
    const { data, error } = await query;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { todos: data ?? [] },
    };
  },
});
