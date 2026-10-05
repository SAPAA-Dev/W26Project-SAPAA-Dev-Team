"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck } from "lucide-react";
import {
  assignSiteSteward,
  getSiteSteward,
  searchStewards,
  StewardOption,
} from "@/utils/steward-actions";

export default function SiteSteward({ siteId, isAdmin }: { siteId: number; isAdmin: boolean }) {
  const [steward, setSteward] = useState<StewardOption | null>(null);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StewardOption[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getSiteSteward(siteId).then(setSteward).catch(() => setSteward(null));
  }, [siteId]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const found = await searchStewards(query);
    setResults(found);
    if (found.length === 0) setMessage("No people match that name.");
  }

  async function assign(person: StewardOption) {
    const result = await assignSiteSteward(siteId, person.id);
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    setSteward(person);
    setEditing(false);
    setQuery("");
    setResults([]);
    setMessage(null);
  }

  return (
    <div className="mt-1 text-[#E4EBE4]" data-testid="site-steward">
      <div className="flex items-center gap-2 text-base">
        <UserCheck className="w-5 h-5" />
        {steward ? (
          <span>
            Steward:{" "}
            <Link href={`/people/${steward.id}`} className="underline font-semibold" data-testid="site-steward-link">
              {steward.displayName}
            </Link>
          </span>
        ) : (
          <span>No steward assigned</span>
        )}
        {isAdmin && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="ml-2 text-sm underline"
            data-testid="site-steward-edit"
          >
            {steward ? "Change" : "Assign steward"}
          </button>
        )}
      </div>

      {isAdmin && editing && (
        <div className="mt-2 bg-white text-[#254431] rounded-xl p-3 shadow-lg max-w-sm">
          <form onSubmit={search} className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people by name"
              aria-label="Search people by name"
              className="flex-1 border border-[#E4EBE4] rounded-lg px-2 py-1 text-sm"
              data-testid="site-steward-search"
            />
            <button type="submit" className="text-sm font-semibold px-2">Search</button>
            <button type="button" onClick={() => setEditing(false)} className="text-sm px-2">Cancel</button>
          </form>
          {results.length > 0 && (
            <ul className="mt-2 divide-y divide-[#E4EBE4]">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => assign(p)}
                    className="w-full text-left text-sm py-1.5 hover:bg-[#F7F2EA]"
                  >
                    {p.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {message && <p className="mt-2 text-sm text-red-700" role="alert">{message}</p>}
        </div>
      )}
    </div>
  );
}
