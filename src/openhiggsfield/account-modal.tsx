"use client";

import { useEffect, useRef, useState } from "react";

import { CloseIcon } from "./icons";

export function AccountModal({
  username,
  generationReady,
  missingGeneration,
  uploads,
  onClose,
}: {
  username: string;
  generationReady: boolean;
  missingGeneration: string[];
  uploads: "blob" | "local";
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ref.current?.showModal();
    panelRef.current?.focus();
  }, []);

  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not sign out");
      window.location.assign("/sign-in");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign out");
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="ohf-account-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div ref={panelRef} tabIndex={-1} className="ohf-dialog-panel ohf-keys-panel">
        <div className="ohf-keys-head">
          <div>
            <div id="ohf-account-title" className="ohf-keys-title">
              Account
            </div>
            <p className="ohf-keys-copy">
              Signed in as <strong>{username}</strong>. Generation keys live in the server
              environment, never in the browser.
            </p>
          </div>
          <button type="button" className="ohf-icon-btn" aria-label="Close" onClick={onClose}>
            <CloseIcon size={13} />
          </button>
        </div>

        <dl className="ohf-account-dl">
          <div>
            <dt>Generation API</dt>
            <dd data-ok={generationReady}>
              {generationReady
                ? "Configured from HF_API_BASE_URL and HF_API_KEY"
                : `Off — missing ${missingGeneration.join(", ") || "HF_API_BASE_URL, HF_API_KEY"}`}
            </dd>
          </div>
          <div>
            <dt>Uploads</dt>
            <dd>
              {uploads === "blob"
                ? "Vercel Blob (OPEN_HIGGSFIELD_READ_WRITE_TOKEN)"
                : "Local disk. Set PUBLIC_ORIGIN so the generation API can fetch attached files."}
            </dd>
          </div>
        </dl>

        {error && (
          <div className="ohf-alert" role="alert">
            <span className="ohf-alert-text">{error}</span>
          </div>
        )}

        <div className="ohf-keys-actions">
          <button type="button" className="ohf-keys-save" disabled={busy} onClick={() => void signOut()}>
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
