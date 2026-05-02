import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Footer() {
  const year = new Date().getFullYear();

function AuthLink({ to, children, requireLogin = false }) {
  const { me } = useAuth();
  const navigate = useNavigate();
  const loggedIn = Boolean(me?.user);

  if (!requireLogin || loggedIn) {
    return (
      <Link
        className="text-sm text-[var(--text-footer-links)] hover:text-[var(--text-on-dark)] transition"
        to={to}
      >
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="text-left text-sm text-[var(--text-footer-links)] hover:text-[var(--text-on-dark)] transition"
      onClick={() => navigate("/login", { state: { from: to } })}
    >
      {children}
    </button>
  );
}

  return (
    <footer className="mt-10 bg-[var(--bg-footer)]">
      <div className="pointer-events-none h-px w-full bg-[rgba(255,255,255,0.08)]" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-10 md:grid-cols-[1.2fr,1fr,1fr,1fr]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/unilink-logo.png"
                alt="UniLink logo"
                className="h-10 w-10 rounded-xl bg-[var(--color-accent)] object-contain"
              />
              <div className="font-display text-base font-semibold tracking-tight text-[var(--text-on-dark)]">
                UniLink
              </div>
            </div>
            <p className="max-w-sm text-sm text-[var(--text-footer-links)]">
              Connecting university students for a brighter future.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-footer-muted)]">
              PRODUCT
            </div>
            <div className="flex flex-col gap-2">
              <AuthLink to="/home#features" requireLogin>
                Features
              </AuthLink>
              <AuthLink to="/home#events" requireLogin>
                Events
              </AuthLink>
              <AuthLink to="/home#groups" requireLogin>
                Groups
              </AuthLink>
              <AuthLink to="/feed" requireLogin>
                Dynamic Feed
              </AuthLink>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-footer-muted)]">
              COMPANY
            </div>
            <div className="flex flex-col gap-2">
              <AuthLink to="/home#about" requireLogin>
                About
              </AuthLink>
              <AuthLink to="/people" requireLogin>
                Students
              </AuthLink>
              <AuthLink to="/profile" requireLogin>
                Profile
              </AuthLink>
              <AuthLink to="/admin" requireLogin>
                Admin
              </AuthLink>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-footer-muted)]">
              LEGAL
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-[var(--text-footer-links)]">Privacy</span>
              <span className="text-sm text-[var(--text-footer-links)]">Terms</span>
              <span className="text-sm text-[var(--text-footer-links)]">Security</span>
              <span className="text-sm text-[var(--text-footer-links)]">Cookies</span>
            </div>
          </div>
        </div>
      </div>
      <div
        className="mt-10 bg-[var(--bg-footer-bar)]"
        style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-[var(--text-footer-muted)]">
          © {year} UniLink. All rights reserved. Made with{" "}
          <span className="text-[var(--color-cta)]">♥</span> for students.
        </div>
      </div>
    </footer>
  );
}

