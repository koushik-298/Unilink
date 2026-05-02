import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export function PostCard({ post }) {
  const qc = useQueryClient();
  const [reported, setReported] = useState(false);
  const [reportMsg, setReportMsg] = useState("");

  const likePost = useMutation({
    mutationFn: async () => (await api.post(`/posts/${post._id}/like`)).data,
    onSuccess: async () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });

  const reportPost = useMutation({
    mutationFn: async () => (await api.post(`/posts/${post._id}/report`, { reason: "" })).data,
    onSuccess: async () => {
      setReported(true);
      setReportMsg("Post reported");
      await qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err) => {
      if (err?.response?.status === 409) {
        setReported(true);
        setReportMsg("Already reported");
      } else {
        setReportMsg(err?.response?.data?.error || "Could not report post");
      }
    },
  });

  return (
    <div className="card p-5 box-border">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-white font-medium">
          {post.authorName?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{post.authorName}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {new Date(post.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="mt-4 whitespace-pre-wrap text-sm text-slate-200 leading-relaxed pl-[3.5rem] break-words">
        {post.content}
      </div>
      
      <div className="mt-5 pt-3 border-t border-white/10 flex items-center gap-2 ml-[3.5rem]">
        <button
          className="btn-ghost flex-1 justify-center gap-2 h-9 shadow-none text-slate-400 hover:text-white"
          onClick={() => likePost.mutate()}
          disabled={likePost.isPending}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
          <span className="text-xs font-medium">Like {post.likeCount > 0 ? `(${post.likeCount})` : ""}</span>
        </button>
        <button className="btn-ghost flex-1 justify-center gap-2 h-9 shadow-none text-slate-400 hover:text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span className="text-xs font-medium">Comment {post.commentCount > 0 ? `(${post.commentCount})` : ""}</span>
        </button>
        <button className="btn-ghost flex-1 justify-center gap-2 h-9 shadow-none text-slate-400 hover:text-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          <span className="text-xs font-medium">Share</span>
        </button>
        {!reported ? (
          <button
            className="btn-ghost flex-1 justify-center gap-2 h-9 shadow-none text-slate-400 hover:text-white"
            onClick={() => reportPost.mutate()}
            disabled={reportPost.isPending}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v16"></path><path d="M4 4h12l-2 4 2 4H4"></path></svg>
            <span className="text-xs font-medium">{reportPost.isPending ? "Reporting..." : "Report"}</span>
          </button>
        ) : null}
      </div>
      {reportMsg ? (
        <div className="mt-2 ml-[3.5rem] text-xs text-[var(--text-secondary)]">{reportMsg}</div>
      ) : null}
    </div>
  );
}
