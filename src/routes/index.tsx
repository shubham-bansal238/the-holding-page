import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The wait is over" },
      { name: "description", content: "The wait is over." },
      { property: "og:title", content: "The wait is over" },
      { property: "og:description", content: "The wait is over." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground">
        the wait is over
      </h1>
    </main>
  );
}
