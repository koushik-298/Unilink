import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { PostCard } from "../components/PostCard";

export function Home() {
  const { me } = useAuth();
  const loggedIn = Boolean(me?.user);

  const postsQuery = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await api.get("/posts")).data.posts,
    enabled: loggedIn,
  });

  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => (await api.get("/profiles")).data.results,
    enabled: loggedIn,
  });

  const connectionsQuery = useQuery({
    queryKey: ["connections"],
    queryFn: async () => (await api.get("/connections")).data.connections,
    enabled: loggedIn,
  });

  const eventsQuery = useQuery({
    queryKey: ["events"],
    queryFn: async () => (await api.get("/events?category=All")).data.events,
    enabled: loggedIn,
  });

  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: async () => (await api.get("/groups")).data.groups,
    enabled: loggedIn,
  });

  if (me?.user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  const totalConnections = connectionsQuery.data?.length || 0;
  const groupsJoined = groupsQuery.data?.filter(g => g.members?.includes(me.user.id)).length || 0;
  const upcomingEventsCount = eventsQuery.data?.filter(e => e.status === "approved").length || 0;

  const recentPosts = postsQuery.data?.slice(0, 3) || [];
  const suggestedPeople = profilesQuery.data
    ?.filter((p) => String(p?.user?.id) !== String(me.user.id))
    .slice(0, 3) || [];
  const upcomingEvents = eventsQuery.data?.filter(e => e.status === "approved").slice(0, 3) || [];
  const suggestedGroups = groupsQuery.data?.filter(g => !g.members?.includes(me.user.id)).slice(0, 3) || [];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,340px] max-w-5xl mx-auto">
      
      <div className="space-y-8">
        
        <section>
          <h1 className="text-2xl font-semibold text-white mb-4">Welcome back, {me.user.name}</h1>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-display font-semibold text-white mb-1">{connectionsQuery.isLoading ? "-" : totalConnections}</div>
              <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Connections</div>
            </div>
            <div className="card p-4 flex flex-col justify-center items-center text-center">
              <div className="text-3xl font-display font-semibold text-white mb-1">{groupsQuery.isLoading ? "-" : groupsJoined}</div>
              <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Groups Joined</div>
            </div>
            <div className="card p-4 flex flex-col justify-center items-center text-center backdrop-blur bg-crimson-500/10 border-crimson-500/20">
              <div className="text-3xl font-display font-semibold text-crimson-400 mb-1">{eventsQuery.isLoading ? "-" : upcomingEventsCount}</div>
              <div className="text-xs font-semibold tracking-wider text-crimson-300 uppercase">Upcoming Events</div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Recent Activity</h2>
          </div>
          
          {postsQuery.isLoading ? (
            <div className="card p-6 text-sm text-slate-300">Loading activity…</div>
          ) : recentPosts.length > 0 ? (
            <div className="space-y-4 relative">
              <div className="absolute top-0 bottom-0 left-[2rem] w-px bg-[var(--border-color)] -z-10 hidden sm:block"></div>
              {recentPosts.map((p) => (
                <PostCard post={p} key={p._id} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center text-slate-400 text-sm border-dashed border-white/10 shadow-none">
              No recent activity on campus.
            </div>
          )}

          <div className="pt-2">
            <Link to="/feed" className="btn-ghost w-full justify-center text-sm py-2.5">
              View full feed
            </Link>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        
        <div className="card overflow-hidden">
          <div className="border-b border-[var(--border-color)] px-4 py-3 text-[11px] font-medium tracking-[0.07em] text-[var(--text-secondary)] uppercase">
            Suggested People
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {profilesQuery.isLoading ? (
              <div className="p-4 text-xs text-[var(--text-hint)]">Loading...</div>
            ) : suggestedPeople.length > 0 ? (
              suggestedPeople.map((person) => (
                <div key={person.user._id} className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-input)] shrink-0 flex items-center justify-center text-xs font-medium text-[var(--text-primary)]">
                       {person.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">{person.user.name}</div>
                      <div className="text-xs text-[var(--text-secondary)] truncate">
                        {person.profile?.department || "Student"}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/people`}
                    className="shrink-0 text-xs bg-[var(--color-accent)] hover:bg-[var(--color-accent)] text-[var(--text-on-btn)] px-3 py-1.5 rounded-lg transition font-medium"
                  >
                    Connect
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-[var(--text-hint)] text-center">No suggestions right now.</div>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-[var(--border-color)] px-4 py-3 text-[11px] font-medium tracking-[0.07em] text-[var(--text-secondary)] uppercase">
            Upcoming Events
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {eventsQuery.isLoading ? (
              <div className="p-4 text-xs text-[var(--text-hint)]">Loading...</div>
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <div key={event._id} className="p-4">
                  <div className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">{event.eventName}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                    <span>{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    •
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
              ))
            ) : (
               <div className="p-4 text-xs text-[var(--text-hint)] text-center">No upcoming events.</div>
            )}
          </div>
          <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
            <Link to="/events" className="block text-center text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent)] transition">
              View all events
            </Link>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-[var(--border-color)] px-4 py-3 text-[11px] font-medium tracking-[0.07em] text-[var(--text-secondary)] uppercase">
            Suggested Groups
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {groupsQuery.isLoading ? (
               <div className="p-4 text-xs text-[var(--text-hint)]">Loading...</div>
            ) : suggestedGroups.length > 0 ? (
              suggestedGroups.map(group => (
                <div key={group._id} className="flex items-center justify-between p-4 gap-3">
                  <div className="truncate">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{group.groupName}</div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">{group.memberCount || group.members?.length || 0} members</div>
                  </div>
                  <Link
                    to={`/groups`}
                    className="shrink-0 text-xs bg-[var(--color-accent)] hover:bg-[var(--color-accent)] text-[var(--text-on-btn)] px-3 py-1.5 rounded-lg transition font-medium"
                  >
                    Join
                  </Link>
                </div>
              ))
            ) : (
               <div className="p-4 text-xs text-[var(--text-hint)] text-center">No groups available.</div>
            )}
          </div>
        </div>

      </aside>
    </div>
  );
}
