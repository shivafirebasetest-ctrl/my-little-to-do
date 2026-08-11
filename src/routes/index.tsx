import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

type Filter = "all" | "active" | "completed";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Little To-Do — Tasks that sync everywhere" },
      {
        name: "description",
        content:
          "A clean, minimal to-do app. Your tasks sync to your account and can be reached from AI assistants over MCP.",
      },
      { property: "og:title", content: "My Little To-Do — Tasks that sync everywhere" },
      {
        property: "og:description",
        content:
          "A clean, minimal to-do app. Your tasks sync to your account and can be reached from AI assistants over MCP.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadTodos = useCallback(async () => {
    const { data, error } = await supabase
      .from("todos")
      .select("id, text, completed, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Could not load your tasks.");
      setLoading(false);
      return;
    }
    setTodos((data ?? []) as Todo[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!session) {
      setTodos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void loadTodos();
  }, [session, loadTodos]);

  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const activeCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    const { data, error } = await supabase
      .from("todos")
      .insert({ text })
      .select("id, text, completed, created_at")
      .single();
    if (error || !data) {
      toast.error("Could not add that task.");
      return;
    }
    setTodos((prev) => [data as Todo, ...prev]);
  }

  async function toggleTodo(todo: Todo) {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)));
    const { error } = await supabase
      .from("todos")
      .update({ completed: !todo.completed })
      .eq("id", todo.id);
    if (error) {
      toast.error("Could not update that task.");
      void loadTodos();
    }
  }

  async function deleteTodo(id: string) {
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete that task.");
      setTodos(previous);
    }
  }

  async function clearCompleted() {
    const previous = todos;
    setTodos((prev) => prev.filter((t) => !t.completed));
    const { error } = await supabase.from("todos").delete().eq("completed", true);
    if (error) {
      toast.error("Could not clear completed tasks.");
      setTodos(previous);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-xl">
        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold tracking-tight">Tasks</CardTitle>
                <CardDescription>Stay on top of what matters.</CardDescription>
              </div>
              {session && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => void supabase.auth.signOut()}
                >
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Sign out
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!authReady ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
            ) : !session ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-foreground">Sign in to see your tasks</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your tasks are saved to your account, so they follow you everywhere.
                </p>
                <Button asChild className="mt-5">
                  <Link to="/auth" search={{ next: "/" }}>
                    Sign in
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <form onSubmit={handleAdd} className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" aria-label="Add task">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>

                <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </Tabs>

                <ul className="space-y-2">
                  {loading ? (
                    <li className="py-8 text-center text-sm text-muted-foreground">Loading…</li>
                  ) : filteredTodos.length === 0 ? (
                    <li className="py-10 text-center">
                      <p className="text-sm font-medium text-foreground">
                        {filter === "all"
                          ? "No tasks yet"
                          : filter === "active"
                            ? "No active tasks"
                            : "No completed tasks"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {filter === "all" ? "Add one above to get started." : "Tasks will appear here."}
                      </p>
                    </li>
                  ) : (
                    filteredTodos.map((todo) => (
                      <li
                        key={todo.id}
                        className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/50"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Checkbox
                            id={`todo-${todo.id}`}
                            checked={todo.completed}
                            onCheckedChange={() => void toggleTodo(todo)}
                          />
                          <label
                            htmlFor={`todo-${todo.id}`}
                            className={`cursor-pointer truncate text-sm ${
                              todo.completed ? "text-muted-foreground line-through" : "text-foreground"
                            }`}
                          >
                            {todo.text}
                          </label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                          onClick={() => void deleteTodo(todo.id)}
                          aria-label="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))
                  )}
                </ul>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {activeCount} {activeCount === 1 ? "item" : "items"} left
                  </span>
                  {completedCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 py-1 text-muted-foreground hover:text-destructive"
                      onClick={() => void clearCompleted()}
                    >
                      Clear completed
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
