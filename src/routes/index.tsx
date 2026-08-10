import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "todo-app-items";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Todo App — Simple Task Manager" },
      { name: "description", content: "A clean, minimal todo app to keep track of your tasks." },
      { property: "og:title", content: "Todo App — Simple Task Manager" },
      { property: "og:description", content: "A clean, minimal todo app to keep track of your tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Todo[];
        setTodos(parsed);
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // ignore storage errors
    }
  }, [todos, hydrated]);

  const filteredTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  const activeCount = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);
  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), text, completed: false, createdAt: Date.now() },
      ...prev,
    ]);
    setInput("");
  }

  function toggleTodo(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function clearCompleted() {
    setTodos((prev) => prev.filter((t) => !t.completed));
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-xl">
        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">Tasks</CardTitle>
            <CardDescription>Stay on top of what matters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              {!hydrated ? (
                <li className="py-8 text-center text-sm text-muted-foreground">Loading...</li>
              ) : filteredTodos.length === 0 ? (
                <li className="py-10 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {filter === "all" ? "No tasks yet" : filter === "active" ? "No active tasks" : "No completed tasks"}
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
                        onCheckedChange={() => toggleTodo(todo.id)}
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
                      onClick={() => deleteTodo(todo.id)}
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
                  onClick={clearCompleted}
                >
                  Clear completed
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
