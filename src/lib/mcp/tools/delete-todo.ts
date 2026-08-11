import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "delete_todo",
  title: "Delete task",
  description: "Permanently delete one of the signed-in user's tasks.",
  inputSchema: {
    id: z.string().describe("The task id to delete."),
  },
  outputSchema: { id: z.string() },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`No task found with id ${id}`);
    return {
      content: [{ type: "text", text: `Deleted task ${id}` }],
      structuredContent: { id },
    };
  },
});
