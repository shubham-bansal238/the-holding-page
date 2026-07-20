import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  allowedCompaniesFor,
  readSession,
  writeSession,
  type SecretCode,
} from "@/lib/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Outstanding Manager" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

const VALID_CODES: SecretCode[] = ["rasp90", "torp80"];

function LoginPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If already signed in, forward to the correct next step.
  useEffect(() => {
    const s = readSession();
    if (!s) return;
    if (!s.module) navigate({ to: "/select-module" });
    else if (s.module === "outstanding" && s.company) window.location.replace("/");
    else if (s.module === "outstanding") navigate({ to: "/select-company" });
    else window.location.replace("/invoice");
  }, [navigate]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = code.trim() as SecretCode;
    if (!VALID_CODES.includes(trimmed)) {
      setError("Invalid Secret Code");
      return;
    }
    // Fresh session — always land on module selection next.
    writeSession({ code: trimmed, company: null, module: null });
    navigate({ to: "/select-module" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Accounts Receivable
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">Outstanding Manager</h1>
        <p className="mt-2 text-sm text-slate-500">Enter your secret code to continue.</p>

        <label className="mt-6 block text-sm font-medium text-slate-700">Secret Code</label>
        <input
          type="password"
          autoFocus
          autoComplete="off"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none"
        />
        {error && (
          <p className="mt-2 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
        >
          Login
        </button>
      </form>
    </div>
  );
}