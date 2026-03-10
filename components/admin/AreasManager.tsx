"use client";

import { useState, useTransition } from "react";
import type { Area } from "@/lib/areas";
import {
  createArea,
  updateArea,
  toggleAreaActive,
  deleteArea,
} from "@/app/admin/areas/actions";

const inputCls =
  "border border-[#D9D9D9] rounded-lg px-3 py-2 text-sm text-[#1E1E1E] bg-white focus:outline-none focus:border-[#1E1E1E] transition";

const DEFAULT_GROUPS = ["Athens & Suburbs", "Attica Coast", "Islands & Other"];

function autoSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AreasManager({ areas: initial }: { areas: Area[] }) {
  const [areas, setAreas] = useState<Area[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add form
  const [addName, setAddName] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [addGroup, setAddGroup] = useState(DEFAULT_GROUPS[0]);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editGroup, setEditGroup] = useState("");

  const existingGroups = Array.from(new Set(areas.map((a) => a.group_name)));
  const allGroups = Array.from(new Set([...DEFAULT_GROUPS, ...existingGroups]));

  function startEdit(area: Area) {
    setEditingId(area.id);
    setEditName(area.name);
    setEditSlug(area.slug);
    setEditGroup(area.group_name);
    setPageError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setPageError(null);
  }

  function handleCreate() {
    setPageError(null);
    startTransition(async () => {
      const result = await createArea(addName, addSlug, addGroup);
      if (result.error) { setPageError(result.error); return; }
      setAddName(""); setAddSlug(""); setAddGroup(DEFAULT_GROUPS[0]);
      setShowAdd(false);
      // Reload to pick up server-revalidated data
      window.location.reload();
    });
  }

  function handleUpdate(id: string) {
    setPageError(null);
    startTransition(async () => {
      const result = await updateArea(id, editName, editSlug, editGroup);
      if (result.error) { setPageError(result.error); return; }
      setEditingId(null);
      window.location.reload();
    });
  }

  function handleToggle(id: string, currentlyActive: boolean) {
    startTransition(async () => {
      const result = await toggleAreaActive(id, currentlyActive);
      if (result.error) { setPageError(result.error); return; }
      setAreas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !currentlyActive } : a))
      );
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This may affect properties that use this area.`)) return;
    startTransition(async () => {
      const result = await deleteArea(id);
      if (result.error) { setPageError(result.error); return; }
      setAreas((prev) => prev.filter((a) => a.id !== id));
    });
  }

  const groups = Array.from(new Set(areas.map((a) => a.group_name)));

  return (
    <div className="flex flex-col gap-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#888888]">
          {areas.length} area{areas.length !== 1 ? "s" : ""} total
        </span>
        <button
          type="button"
          onClick={() => { setShowAdd(!showAdd); setPageError(null); }}
          className="px-4 py-2 bg-[#1E1E1E] text-white text-sm font-semibold rounded-lg hover:bg-[#333333] transition"
        >
          {showAdd ? "Cancel" : "+ Add Area"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-[#E8E8E8] rounded-xl p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#1E1E1E]">New Area</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#888888]">Name</label>
              <input
                className={inputCls}
                value={addName}
                placeholder="e.g. Kifisia"
                onChange={(e) => {
                  setAddName(e.target.value);
                  setAddSlug(autoSlug(e.target.value));
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#888888]">Slug</label>
              <input
                className={inputCls}
                value={addSlug}
                placeholder="e.g. kifisia"
                onChange={(e) => setAddSlug(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#888888]">Group</label>
              <select
                className={inputCls}
                value={addGroup}
                onChange={(e) => setAddGroup(e.target.value)}
              >
                {allGroups.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending || !addName.trim() || !addSlug.trim()}
              className="px-4 py-2 bg-[#1E1E1E] text-white text-sm rounded-lg hover:bg-[#333333] transition disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setPageError(null); }}
              className="px-4 py-2 border border-[#D9D9D9] text-sm rounded-lg hover:bg-[#F5F5F5] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {pageError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {pageError}
        </div>
      )}

      {/* Groups */}
      {groups.map((group) => (
        <div key={group} className="bg-white border border-[#E8E8E8] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA]">
            <span className="text-xs font-semibold text-[#888888] uppercase tracking-widest">
              {group}
            </span>
          </div>
          <div className="divide-y divide-[#F0F0F0]">
            {areas
              .filter((a) => a.group_name === group)
              .map((area) => (
                <div key={area.id} className="px-5 py-3">
                  {editingId === area.id ? (
                    <div className="flex items-end gap-3 flex-wrap">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#888888]">Name</label>
                        <input
                          className={`${inputCls} w-36`}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#888888]">Slug</label>
                        <input
                          className={`${inputCls} w-36`}
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[#888888]">Group</label>
                        <select
                          className={`${inputCls} w-48`}
                          value={editGroup}
                          onChange={(e) => setEditGroup(e.target.value)}
                        >
                          {allGroups.map((g) => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2 pb-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdate(area.id)}
                          disabled={isPending}
                          className="px-3 py-2 bg-[#1E1E1E] text-white text-sm rounded-lg hover:bg-[#333333] transition disabled:opacity-50"
                        >
                          {isPending ? "…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-2 border border-[#D9D9D9] text-sm rounded-lg hover:bg-[#F5F5F5] transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-medium ${
                          area.is_active ? "text-[#1E1E1E]" : "text-[#AAAAAA] line-through"
                        }`}
                      >
                        {area.name}
                      </span>
                      <span className="text-xs text-[#AAAAAA] font-mono">{area.slug}</span>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => handleToggle(area.id, area.is_active)}
                        disabled={isPending}
                        title={area.is_active ? "Deactivate" : "Activate"}
                        className={`text-xs px-2.5 py-1 rounded-full border transition disabled:opacity-50 ${
                          area.is_active
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            : "bg-[#F5F5F5] border-[#E0E0E0] text-[#AAAAAA] hover:bg-[#EBEBEB]"
                        }`}
                      >
                        {area.is_active ? "Active" : "Inactive"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(area)}
                        className="text-xs text-[#888888] hover:text-[#1E1E1E] transition px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(area.id, area.name)}
                        disabled={isPending}
                        className="text-xs text-red-400 hover:text-red-600 transition px-2 py-1 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}

      {areas.length === 0 && !showAdd && (
        <div className="bg-white border border-[#E8E8E8] rounded-lg px-6 py-16 flex items-center justify-center">
          <p className="text-sm text-[#AAAAAA]">No areas yet. Add the first one above.</p>
        </div>
      )}
    </div>
  );
}
