"use client";

import { useState } from "react";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export default function QAPage() {
  const [health, setHealth] = useState<JsonValue>(null);
  const [search, setSearch] = useState<JsonValue>(null);
  const [lead,   setLead]   = useState<JsonValue>(null);

  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingLead,   setLoadingLead]   = useState(false);

  async function runHealth() {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/health");
      setHealth(await res.json());
    } finally {
      setLoadingHealth(false);
    }
  }

  async function runSearch() {
    setLoadingSearch(true);
    try {
      const res = await fetch("/api/debug/search", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: "50 sqm apartment in Glyfada with sea view" }),
      });
      setSearch(await res.json());
    } finally {
      setLoadingSearch(false);
    }
  }

  async function runLead() {
    setLoadingLead(true);
    try {
      const res = await fetch("/api/debug/lead");
      setLead(await res.json());
    } finally {
      setLoadingLead(false);
    }
  }

  return (
    <div className="p-10 space-y-8 max-w-3xl font-mono text-sm">
      <h1 className="text-2xl font-bold font-sans">QA Panel</h1>

      <Section
        label="1. Health check"
        buttonLabel={loadingHealth ? "Checking…" : "Check Health"}
        onClick={runHealth}
        disabled={loadingHealth}
        result={health}
      />

      <Section
        label='2. AI search — "50 sqm apartment in Glyfada with sea view"'
        buttonLabel={loadingSearch ? "Searching…" : "Test AI Search"}
        onClick={runSearch}
        disabled={loadingSearch}
        result={search}
      />

      <Section
        label="3. Lead insert (inserts TEST QA row)"
        buttonLabel={loadingLead ? "Inserting…" : "Test Lead Insert"}
        onClick={runLead}
        disabled={loadingLead}
        result={lead}
      />
    </div>
  );
}

function Section({
  label,
  buttonLabel,
  onClick,
  disabled,
  result,
}: {
  label:       string;
  buttonLabel: string;
  onClick:     () => void;
  disabled:    boolean;
  result:      JsonValue;
}) {
  return (
    <div className="space-y-2">
      <p className="font-sans text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {buttonLabel}
      </button>
      {result !== null && (
        <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-xs overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
