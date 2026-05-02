import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

const CATEGORIES = ["Tech", "Sports", "Design", "Literature", "Photography", "Other"];

export function Groups() {
  const qc = useQueryClient();
  const { me } = useAuth();
  const myId = me?.user?.id;

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Tech");
  const [maxMembers, setMaxMembers] = useState(0);

  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await api.get("/groups")).data.groups,
  });

  const createGroup = useMutation({
    mutationFn: async () => (await api.post("/groups", {
      groupName,
      description: `[${category}] ${description}`,
      maxMembers: Number(maxMembers) || 0,
    })).data,
    onSuccess: async () => {
      setGroupName("");
      setDescription("");
      setCategory("Tech");
      setMaxMembers(0);
      await qc.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const joinGroup = useMutation({
    mutationFn: async (groupId) => (await api.post(`/groups/${groupId}/join`)).data,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });

  const leaveGroup = useMutation({
    mutationFn: async (groupId) => (await api.post(`/groups/${groupId}/leave`)).data,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["groups"] }),
  });

  const allGroups = groupsQuery.data || [];
  const yourGroups = allGroups.filter(g => g.members?.includes(myId));
  const suggestedGroups = allGroups.filter(g => !g.members?.includes(myId));

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-semibold text-white">Groups</h2>
        <p className="mt-1 text-sm text-slate-300">
          Create or join interest-based groups to connect with peers and form your tribe.
        </p>
      </div>

      {groupsQuery.isLoading ? (
        <div className="card p-6 text-sm text-slate-300">Loading groups…</div>
      ) : groupsQuery.isError ? (
        <div className="card p-6 text-sm text-rose-300">Failed to load groups.</div>
      ) : (
        <div className="space-y-10">
          
          <section>
            <h3 className="text-lg font-medium text-white mb-4">Suggested Groups</h3>
            {suggestedGroups.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {suggestedGroups.map((g) => (
                  <div key={g._id} className="card p-5 border-white/5 hover:border-white/10 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-white">{g.groupName}</div>
                        <div className="mt-1 text-xs font-medium text-crimson-400">{g.members?.length || 0} members</div>
                        {g.description ? <div className="mt-3 text-sm text-slate-300 line-clamp-2">{g.description}</div> : null}
                      </div>
                      <button className="btn-primary text-xs shrink-0 py-1.5 px-4" onClick={() => joinGroup.mutate(g._id)} disabled={joinGroup.isPending}>
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 border-dashed border-white/10 text-center shadow-none bg-transparent">
                <div className="text-sm text-slate-400">You're participating in every unique group across campus!</div>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-lg font-medium text-white mb-4">Your Groups</h3>
            {yourGroups.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {yourGroups.map((g) => (
                  <div key={g._id} className="card p-5 border border-emerald-500/20 bg-emerald-500/5 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-white">{g.groupName}</div>
                        <div className="mt-1 text-xs font-medium text-emerald-400">{g.members?.length || 0} members</div>
                        {g.description ? <div className="mt-3 text-sm text-slate-300 line-clamp-2">{g.description}</div> : null}
                      </div>
                      <button className="btn-ghost shrink-0 py-1.5 px-3 text-xs border border-white/10 bg-white/5" onClick={() => leaveGroup.mutate(g._id)} disabled={leaveGroup.isPending}>
                        Leave
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-10 border-dashed border-[var(--border-color)] text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-[var(--bg-input)] flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <h3 className="text-base font-medium text-[var(--text-primary)] mb-1">No groups joined yet</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-sm mx-auto">
                   Explore the suggested groups above and become a part of the community, or launch your own movement!
                </p>
                <button className="btn-primary text-sm py-1.5 px-4" onClick={() => {
                  const input = document.getElementById('create-group-input');
                  if(input) { input.focus(); input.scrollIntoView({behavior: 'smooth', block: 'center'}); }
                }}>
                  Create a new group
                </button>
              </div>
            )}
          </section>

        </div>
      )}

      <div className="border-t border-white/10 pt-10">
        <div className="card p-6 md:p-8">
          <div className="text-lg font-medium text-[var(--text-primary)]">Create a Group</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)] mb-6">Launch a brand new chapter on campus.</div>
          <form
            className="grid gap-5 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!groupName.trim()) return;
              createGroup.mutate();
            }}
          >
            <div>
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Group name</label>
              <input id="create-group-input" className="input mt-2" placeholder="e.g. Robotics Club" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Category</label>
              <select className="input mt-2 bg-black/20" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Max members (0 = unlimited)
              </label>
              <input
                type="number"
                min={0}
                className="input mt-2"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value === "" ? 0 : Number(e.target.value))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Description</label>
              <textarea
                className="input mt-2 min-h-[96px] resize-none bg-black/20"
                placeholder="What is this group about? Who should join?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button className="btn-primary px-6 py-2" disabled={createGroup.isPending}>
                {createGroup.isPending ? "Creating…" : "Create group"}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
