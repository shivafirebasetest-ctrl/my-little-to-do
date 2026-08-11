import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const TodoShape = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  created_at: z.string(),
});


export default defineTool({
  name: "update_todo",
  title: "Update task",
  description: "Rename a task or change whether it is completed.",
  inputSchema: {
    id: z.string().describe("The task id."),
    text: z.string().trim().min(1).optional().describe("New task text."),
    completed: z.boolean().optional().describe("Mark the task complete or incomplete."),
  },
  outputSchema: { todo: TodoShape },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ id, text, completed }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    if (text === undefined && completed === undefined) {
      throw new ToolError("Provide text and/or completed to update.");
    }
    const supabase = supabaseForUser(ctx);
    const patch: { text?: string; completed?: boolean } = {};
    if (text !== undefined) patch.text = text;
    if (completed !== undefined) patch.completed = completed;
    const { data, error } = await supabase
      .from("todos")
      .update(patch)
      .eq("id", id)
      .select("id, text, completed, created_at")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`No task found with id ${id}`);
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { todo: data },
    };
  },
});
