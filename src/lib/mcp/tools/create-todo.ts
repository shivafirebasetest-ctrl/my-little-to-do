import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_todo",
  title: "Create task",
  description: "Add a new task for the signed-in user.",
  inputSchema: {
    text: z.string().trim().min(1).describe("What needs to be done."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ text }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("todos")
      .insert({ text, user_id: ctx.getUserId() })
      .select("id, text, completed, created_at")
      .single();
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: `Created task: ${data.text}` }],
      structuredContent: { todo: data },
    };
  },
});
