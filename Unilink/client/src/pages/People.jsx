import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function People() {
  const { me } = useAuth();
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [skill, setSkill] = useState("");
  const [interest, setInterest] = useState("");

  const isSearching = Boolean(q || department || skill || interest);
  const params = useMemo(() => ({ q, department, skill, interest }), [q, department, skill, interest]);

  const peopleQuery = useQuery({
    queryKey: ["people", params],
    queryFn: async () => (await api.get("/profiles", { params })).data.results,
  });

  const sendRequest = useMutation({
    mutationFn: async (toUserId) => (await api.post("/connections/request", { toUserId })).data,
  });
  const filteredPeople = (peopleQuery.data || []).filter(
    (person) => String(person?.user?.id) !== String(me?.user?.id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">People</h2>
        <p className="mt-1 text-sm text-slate-300">Find students by name, department, skills, or interests.</p>
      </div>

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-300">Search</label>
            <input className="input mt-1" placeholder="Rahul, Ananya…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-300">Department</label>
            <input className="input mt-1" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-300">Skill</label>
            <input className="input mt-1" placeholder="JavaScript" value={skill} onChange={(e) => setSkill(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-300">Interest</label>
            <input className="input mt-1" placeholder="Hackathons" value={interest} onChange={(e) => setInterest(e.target.value)} />
          </div>
        </div>
      </div>

      {peopleQuery.isLoading ? (
        <div className="card p-6 text-sm text-slate-300">Searching…</div>
      ) : peopleQuery.isError ? (
        <div className="card p-6 text-sm text-rose-300">Failed to load people.</div>
      ) : (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
            {isSearching ? "Search Results" : "Suggested People"}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPeople.length ? (
              filteredPeople.map((r) => (
                <div key={r.user.id} className="card p-5 hover:border-[var(--border-color)] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] shrink-0 flex items-center justify-center text-lg font-medium text-[var(--text-primary)] shadow-lg">
                        {r.user.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-[var(--text-primary)] truncate">{r.user.name}</div>
                        <div className="mt-0.5 text-xs text-[var(--text-secondary)] truncate">{r.profile?.department || "Student"}</div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(r.profile?.skills || []).slice(0, 4).map((s) => (
                            <span key={s} className="chip text-[10px] py-0.5 px-2">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="btn-primary text-xs shrink-0 py-1.5 px-3" onClick={() => sendRequest.mutate(r.user.id)} disabled={sendRequest.isPending}>
                      Connect
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-6 text-sm text-slate-300 md:col-span-2">No matches yet. Try a different search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

