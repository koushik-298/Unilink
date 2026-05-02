import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Footer } from "./Footer";
import { SidebarNav } from "./SidebarNav";

const PUBLIC_ROUTES = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);

function TopNavLink({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-xl px-3 py-2 text-sm transition ${
          isActive
            ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)] rounded-b-none"
            : "text-[var(--text-secondary)] border-b-2 border-transparent hover:text-[var(--text-primary)]"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function BrandMark({ variant = "dark" }) {
  const isLight = variant === "light";
  return (
    <>
      <img
        src="/unilink-logo.png"
        alt="UniLink logo"
        className={
          isLight
            ? "h-10 w-10 shrink-0 rounded-xl bg-[var(--color-primary)] object-contain"
            : "h-10 w-10 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] object-contain"
        }
      />
      <div className="leading-tight">
        <div
          className={
            isLight
              ? "font-display text-base font-semibold tracking-tight text-[var(--text-primary)]"
              : "font-display text-base font-semibold tracking-tight text-white"
          }
        >
          {isLight ? "UniLink" : <span className="brand-gradient">UniLink</span>}
        </div>
        <div className={isLight ? "text-xs text-[var(--text-secondary)]" : "text-xs text-slate-400"}>
          University networking
        </div>
      </div>
    </>
  );
}

function SidebarBrand({ inSidebar, homePath, setSidebarOpen }) {
  if (inSidebar) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link to={homePath} className="flex min-w-0 flex-1 items-center gap-3">
          <BrandMark />
        </Link>
        <button
          type="button"
          className="btn-ghost shrink-0 rounded-xl px-2 py-2 text-slate-400 hover:text-black"
          onClick={() => setSidebarOpen(false)}
          aria-label="Hide sidebar"
          title="Hide sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-xl text-left transition hover:bg-white/[0.04]"
      onClick={() => setSidebarOpen(true)}
      aria-label="Show sidebar"
      title="Show sidebar"
    >
      <BrandMark />
    </button>
  );
}

export function Layout() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const loggedIn = Boolean(me?.user);
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true, state: { loggedOut: true } });
  }
  const isPublic = PUBLIC_ROUTES.has(location.pathname);
  const useSidebar = loggedIn && !isPublic;

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const profile = me?.profile;
  const isProfileIncomplete = loggedIn && me?.user?.role !== "admin" && (!profile || (
    !String(profile.department || "").trim() &&
    !String(profile.bio || "").trim() &&
    !(profile.skills && profile.skills.length)
  ));

  const homePath = loggedIn && me?.user?.role === "admin" ? "/admin" : "/home";

  const headerBrand = (
    <Link to={loggedIn ? homePath : "/login"} className="flex items-center gap-3">
      <BrandMark variant={isPublic ? "light" : "dark"} />
    </Link>
  );

  if (useSidebar) {
    return (
      <div className="flex min-h-full bg-[var(--bg-page)]">
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-[var(--bg-sidebar)] transition-[width] duration-200 ease-out md:flex ${
            sidebarOpen ? "w-64 border-r" : "w-0 overflow-hidden border-r-0"
          }`}
          aria-hidden={!sidebarOpen}
          style={{ borderRight: sidebarOpen ? "0.5px solid rgba(255,255,255,0.1)" : undefined }}
        >
          <div className="flex h-full min-h-0 w-64 flex-col">
            <div className="p-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.1)" }}>
              <SidebarBrand inSidebar homePath={homePath} setSidebarOpen={setSidebarOpen} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <SidebarNav role={me.user.role} />
            </div>
            <div className="p-3 text-xs text-[var(--text-footer-links)]" style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)" }}>
              Signed in as <span className="text-[var(--text-on-dark)]">{me.user.email}</span>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header
            className="sticky top-0 z-20 backdrop-blur md:hidden"
            style={{ backgroundColor: "var(--bg-navbar)", borderBottom: "0.5px solid var(--border-color)" }}
          >
            <div className="flex items-center justify-between px-4 py-3">{headerBrand}</div>
            <div className="overflow-x-auto px-2 py-2" style={{ borderTop: "0.5px solid var(--border-color)" }}>
              <div className="flex min-w-max gap-1">
                {me.user.role === "admin" ? (
                  <>
                    <TopNavLink to="/admin" end>Dashboard</TopNavLink>
                    <TopNavLink to="/admin/users">Users</TopNavLink>
                    <TopNavLink to="/admin/events">Events Queue</TopNavLink>
                    <TopNavLink to="/admin/groups">Groups</TopNavLink>
                    <TopNavLink to="/admin/reports">Reports</TopNavLink>
                  </>
                ) : (
                  <>
                    <TopNavLink to="/feed">Feed</TopNavLink>
                    <TopNavLink to="/events">Events</TopNavLink>
                    <TopNavLink to="/groups">Groups</TopNavLink>
                    <TopNavLink to="/people">People</TopNavLink>
                    <TopNavLink to="/profile">Profile</TopNavLink>
                    <TopNavLink to="/settings">Settings</TopNavLink>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl px-3 py-2 text-sm transition text-[var(--color-accent)] border border-[var(--border-color)] bg-transparent"
                  style={{ borderWidth: "0.5px" }}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <header
            className="sticky top-0 z-10 hidden backdrop-blur md:block"
            style={{ backgroundColor: "var(--bg-navbar)", borderBottom: "0.5px solid var(--border-color)" }}
          >
            <div
              className={`flex items-center gap-4 px-6 py-3 ${sidebarOpen ? "justify-end" : "justify-between"}`}
            >
              {!sidebarOpen ? (
                <div className="min-w-0">
                  <SidebarBrand inSidebar={false} homePath={homePath} setSidebarOpen={setSidebarOpen} />
                </div>
              ) : null}
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{me.user.name}</div>
                  <div className="text-xs text-[var(--text-secondary)] capitalize">{me.user.role}</div>
                </div>
                <button type="button" className="btn-ghost" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </header>

          {isProfileIncomplete ? (
            <div
              className="px-4 py-3 md:px-6"
              style={{ backgroundColor: "var(--warning-bg)", borderBottom: "0.5px solid #E0CDB8" }}
            >
              <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
                <div className="text-sm text-[var(--warning-text)]">
                  <span className="font-semibold text-[#5A3E28]">Profile Incomplete!</span> Please fill out your department, bio, and skills to help others find you — open{" "}
                  <Link className="text-[var(--warning-link)] underline font-medium hover:text-[var(--warning-link)]" to="/settings">
                    Settings
                  </Link>{" "}
                  or{" "}
                  <Link className="text-[var(--warning-link)] underline font-medium hover:text-[var(--warning-link)]" to="/profile">
                    Profile
                  </Link>
                  .
                </div>
              </div>
            </div>
          ) : null}

          <main className="flex-1 px-4 py-6 md:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <header
        className="sticky top-0 z-20 backdrop-blur"
        style={{
          backgroundColor: "var(--bg-navbar)",
          borderBottom: "0.5px solid var(--border-color)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {headerBrand}



          {loggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <div className="text-sm font-medium text-white">{me.user.name}</div>
                <div className="text-xs text-slate-400">{me.user.role}</div>
              </div>
              <button type="button" className="btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
