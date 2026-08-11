import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTodos from "./tools/list-todos";
import createTodo from "./tools/create-todo";
import updateTodo from "./tools/update-todo";
import deleteTodo from "./tools/delete-todo";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged, and Vite inlines it at build time.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "my-little-to-do",
  title: "My Little To-Do",
  version: "0.1.0",
  instructions:
    "Tools for the My Little To-Do task app. Use `list_todos` to read the signed-in user's tasks, `create_todo` to add one, `update_todo` to rename or complete a task, and `delete_todo` to remove one.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTodos, createTodo, updateTodo, deleteTodo],
});
