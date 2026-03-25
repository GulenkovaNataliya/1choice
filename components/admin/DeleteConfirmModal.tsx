"use client";

import React from "react";

type DeleteConfirmModalProps = {
  open: boolean;
  propertyTitle: string;
  value: string;
  loading?: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({
  open,
  propertyTitle,
  value,
  loading = false,
  onChange,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!open) return null;

  const isValid = value.trim() === "DELETE";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#D9D9D9] bg-white p-6 shadow-xl">
        <h2 className="text-[22px] font-semibold text-[#1E1E1E]">
          Delete Property
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#404040]">
          This action permanently deletes the property and cannot be undone.
        </p>

        <div className="mt-4 rounded-xl border border-[#D9D9D9] bg-[#F4F4F4] p-3 text-sm text-[#1E1E1E]">
          <span className="block text-xs text-[#666] mb-1">Property</span>
          <span className="font-medium break-words">{propertyTitle}</span>
        </div>

        <div className="mt-4 rounded-xl border border-[#C1121F]/20 bg-[#FFF7F7] p-3 text-sm text-[#1E1E1E]">
          Type <span className="font-semibold">DELETE</span> to confirm permanent deletion.
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type DELETE"
          autoFocus
          className="mt-4 w-full rounded-xl border border-[#D9D9D9] bg-white px-4 py-3 text-sm text-[#1E1E1E] outline-none focus:border-[#1E1E1E]"
        />

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-[#D9D9D9] px-4 py-2.5 text-sm font-medium text-[#1E1E1E] transition hover:bg-[#F4F4F4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!isValid || loading}
            className="rounded-xl bg-[#C1121F] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#D9D9D9] disabled:text-[#777]"
          >
            {loading ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
