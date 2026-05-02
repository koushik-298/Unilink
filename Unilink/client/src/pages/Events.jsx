import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

const CATEGORIES = ["All", "Workshop", "Seminar", "Hackathon", "Club Activity", "Sports", "Other"];

function getCreatorId(createdBy) {
  if (!createdBy) return "";
  if (typeof createdBy === "string") return createdBy;
  if (typeof createdBy === "object") return createdBy._id || createdBy.id || "";
  return "";
}

function CalendarView({ events, myId, toggleReminder, renderStatus }) {
  if (!events || events.length === 0) return null;

  const eventsByDate = {};
  events.forEach(e => {
    const d = new Date(e.date).toLocaleDateString();
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(e);
  });

  const dates = Object.keys(eventsByDate).sort((a, b) => new Date(a) - new Date(b));

  return (
    <div className="grid gap-4 w-full">
      {dates.map(dateKey => (
        <div key={dateKey} className="card p-4 flex flex-col md:flex-row gap-4 border-l-4 border-l-crimson-500 rounded-l-none">
          <div className="md:w-32 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-xl p-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 tracking-tight">{new Date(dateKey).getDate()}</div>
              <div className="text-sm font-semibold uppercase text-crimson-600">{new Date(dateKey).toLocaleString('default', { month: 'short' })}</div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {eventsByDate[dateKey].map(e => {
              const hasReminder = Boolean(e.reminders?.includes(myId));
              const isOwnPending = getCreatorId(e.createdBy) === String(myId) && e.status === "pending";
              return (
                <div key={e._id} className="group relative flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="chip text-[10px] whitespace-nowrap">{e.category || "Other"}</span>
                      {renderStatus(e)}
                    </div>
                    <div className="font-semibold text-gray-900">{e.eventName}</div>
                    <div className="text-xs text-gray-500">{new Date(e.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    {isOwnPending && (
                      <div className="mt-1 text-xs text-amber-600">
                        Submitted by you. Waiting for admin approval.
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-emerald-600 font-medium">
                      {(e.registrations?.length || 0)} attending
                    </div>
                    {e.status === "approved" && (
                      <button
                        onClick={() => toggleReminder.mutate(e._id)}
                        disabled={toggleReminder.isPending}
                        className={`p-2 rounded-lg transition-colors ${hasReminder ? 'bg-crimson-100 text-crimson-600' : 'bg-gray-200 text-gray-500 hover:text-gray-900'}`}
                        title={hasReminder ? "Remove Reminder" : "Set Reminder"}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={hasReminder ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Events() {
  const { me } = useAuth();
  const qc = useQueryClient();
  const isAdmin = me?.user?.role === "admin";
  const myId = me?.user?.id;

  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");

  const [viewMode, setViewMode] = useState("list");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createMessage, setCreateMessage] = useState("");

  const eventsQuery = useQuery({
    queryKey: ["events", myId, categoryFilter],
    queryFn: async () => (await api.get(`/events?category=${encodeURIComponent(categoryFilter)}`)).data.events,
  });

  const myPendingEvents = (eventsQuery.data || []).filter(
    (eventItem) => eventItem.status === "pending" && getCreatorId(eventItem.createdBy) === String(myId),
  );
  const approvedEvents = (eventsQuery.data || []).filter((eventItem) => eventItem.status === "approved");
  const pendingEvents = (eventsQuery.data || []).filter((eventItem) => eventItem.status === "pending");
  const rejectedEvents = (eventsQuery.data || []).filter((eventItem) => eventItem.status === "rejected");

  function getEventIsoDate() {
    if (!date) return "";
    // If time isn't selected, default to 09:00 for a predictable value.
    const t = time || "09:00";
    const composed = `${date}T${t}`;
    const d = new Date(composed);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString();
  }

  const createEvent = useMutation({
    mutationFn: async () =>
      (await api.post("/events", { eventName, date: getEventIsoDate(), location, description, category })).data,
    onSuccess: async (response) => {
      const createdEvent = response?.event;

      if (createdEvent) {
        qc.setQueriesData({ queryKey: ["events"] }, (current) => {
          if (!Array.isArray(current)) return current;
          if (current.some((item) => item._id === createdEvent._id)) return current;

          const matchesCategory = categoryFilter === "All" || createdEvent.category === categoryFilter;
          if (!matchesCategory) return current;

          return [...current, createdEvent].sort((a, b) => new Date(a.date) - new Date(b.date));
        });
      }

      setCreateMessage(
        isAdmin
          ? "Event created and published."
          : "Event created successfully. It is pending admin approval.",
      );
      setEventName("");
      setDate("");
      setTime("");
      setLocation("");
      setDescription("");
      setCategory("Other");
      setShowCreateForm(false);
      await qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const registerEvent = useMutation({
    mutationFn: async (eventId) => (await api.post(`/events/${eventId}/register`)).data,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  const toggleReminder = useMutation({
    mutationFn: async (eventId) => (await api.post(`/events/${eventId}/reminder`)).data,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["events"] }),
  });

  function renderStatus(e) {
    if (e.status === "approved") {
      return (
        <span className="rounded-full border border-emerald-600/40 bg-emerald-500/20 px-2 py-1 text-xs text-emerald-700">
          Approved
        </span>
      );
    }
    if (e.status === "rejected") {
      return (
        <span className="rounded-full border border-rose-600/40 bg-rose-500/20 px-2 py-1 text-xs text-rose-700">
          Rejected
        </span>
      );
    }
    return (
      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-200">
        Pending Admin Approval
      </span>
    );
  }

  function renderEventCard(e) {
    const hasReminder = Boolean(e.reminders?.includes(myId));
    const isOwnPending = getCreatorId(e.createdBy) === String(myId) && e.status === "pending";

    return (
      <div key={e._id} className="card p-5 relative overflow-hidden group border-white/5 hover:border-white/20 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="chip text-[10px]">{e.category || "Other"}</span>
              {renderStatus(e)}
            </div>
            <div className="text-lg font-semibold text-white leading-tight">{e.eventName}</div>
            <div className="mt-1 text-sm text-slate-400">{new Date(e.date).toLocaleString()}</div>
            {isOwnPending && (
              <div className="mt-1 text-xs text-amber-300">
                Submitted by you. Waiting for admin approval.
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              {e.registrations?.length || 0}
            </span>
            {e.status === "approved" && (
              <button
                onClick={() => toggleReminder.mutate(e._id)}
                disabled={toggleReminder.isPending}
                className={`p-1.5 rounded transition ${hasReminder ? 'text-crimson-400' : 'text-slate-500 hover:text-white'}`}
                title={hasReminder ? "Remove Reminder" : "Set Reminder"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={hasReminder ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              </button>
            )}
          </div>
        </div>
        {e.location ? <div className="mt-3 text-sm text-slate-300 flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> {e.location}</div> : null}
        {e.description ? <div className="mt-2 text-sm text-slate-200 line-clamp-3">{e.description}</div> : null}
        <div className="mt-5 flex justify-end">
          <button
            className="btn-primary"
            onClick={() => registerEvent.mutate(e._id)}
            disabled={registerEvent.isPending || (e.status !== "approved" && !isAdmin)}
          >
            Register
          </button>
        </div>
      </div>
    );
  }

  function renderSection(title, events, tone = "text-slate-200", emptyMessage = "No events in this section.") {
    return (
      <section className="space-y-3">
        <div className={`text-sm font-semibold ${tone}`}>
          {title} ({events.length})
        </div>
        {events.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((eventItem) => renderEventCard(eventItem))}
          </div>
        ) : (
          <div className="card p-4 text-sm text-slate-400">{emptyMessage}</div>
        )}
      </section>
    );
  }

  function renderCalendarSection(title, events, tone = "text-slate-200", emptyMessage = "No events in this section.") {
    return (
      <section className="space-y-3">
        <div className={`text-sm font-semibold ${tone}`}>
          {title} ({events.length})
        </div>
        {events.length ? (
          <CalendarView
            events={events}
            myId={myId}
            toggleReminder={toggleReminder}
            renderStatus={renderStatus}
          />
        ) : (
          <div className="card p-4 text-sm text-slate-400">{emptyMessage}</div>
        )}
      </section>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Events</h2>
          <p className="mt-1 text-sm text-slate-300">
            Workshops, seminars, hackathons, sports, cultural and club activities.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Calendar Timeline
            </button>
          </div>
          <button
            type="button"
            className="btn-primary flex items-center gap-2 px-4 py-2"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Event
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="card p-4">
          <div className="text-sm font-medium text-white">Create an event</div>
          <div className="mt-1 text-xs text-slate-400">
            {isAdmin ? "Admins auto-approve events." : "Student events require admin approval."}
          </div>
          <form
            className="mt-4 grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!eventName.trim() || !date) return;
              setCreateMessage("");
              createEvent.mutate();
            }}
          >
            <div className="md:col-span-2 flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-300">Event name</label>
                <input className="input mt-1" value={eventName} onChange={(e) => setEventName(e.target.value)} />
              </div>
              <div className="md:w-64">
                <label className="text-xs text-slate-300">Category</label>
                <select className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-300">Date</label>
              <input className="input mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-300">Time</label>
              <input className="input mt-1" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-slate-300">Location</label>
              <input className="input mt-1" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-300">Description</label>
              <textarea
                className="input mt-1 min-h-[96px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" className="btn-ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={createEvent.isPending}>
                {createEvent.isPending ? "Creating…" : "Create event"}
              </button>
            </div>
            {createMessage && <div className="md:col-span-2 text-xs text-amber-300">{createMessage}</div>}
          </form>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-300 font-medium">Filter by category:</label>
        <select
          className="input w-48 py-1.5 min-h-0"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {myPendingEvents.length > 0 && (
        <div className="card p-4 border-l-4 border-l-amber-500">
          <div className="text-sm font-semibold text-amber-300">
            Your event is pending admin approval
          </div>
          <div className="mt-1 text-xs text-slate-300">
            {myPendingEvents.length} submitted event{myPendingEvents.length > 1 ? "s are" : " is"} waiting for admin review.
          </div>
        </div>
      )}

      {eventsQuery.isLoading ? (
        <div className="card p-6 text-sm text-slate-300">Loading events…</div>
      ) : eventsQuery.isError ? (
        <div className="card p-6 text-sm text-rose-300">Failed to load events.</div>
      ) : eventsQuery.data?.length > 0 ? (
        viewMode === "calendar" ? (
          <div className="space-y-6">
            {renderCalendarSection("Approved Events", approvedEvents, "text-emerald-700", "No approved events yet.")}
            {renderCalendarSection("Pending Events", pendingEvents, "text-amber-300", "No pending approvals right now.")}
            {renderCalendarSection("Rejected Events", rejectedEvents, "text-rose-700", "No rejected events.")}
          </div>
        ) : (
          <div className="space-y-6">
            {renderSection("Approved Events", approvedEvents, "text-emerald-700", "No approved events yet.")}
            {renderSection("Pending Events", pendingEvents, "text-amber-300", "No pending approvals right now.")}
            {renderSection("Rejected Events", rejectedEvents, "text-rose-700", "No rejected events.")}
          </div>
        )
      ) : (
        <div className="card p-12 mt-6 text-center border-dashed border-white/20 bg-transparent">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No events yet</h3>
          <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
            The campus event calendar is empty. Why not be the first to organize a workshop or meetup?
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              setShowCreateForm(true);
              setTimeout(() => {
                const input = document.querySelector('input.input');
                if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
              }, 50);
            }}
          >
            Create an event
          </button>
        </div>
      )}
    </div>
  );
}
