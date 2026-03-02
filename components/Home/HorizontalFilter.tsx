"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

type PillKey = "transaction" | "type" | "location" | "price" | "bedrooms" | "more" | null;
type MoreAccKey = "condition" | "features" | null;
type MobileAccKey = "transaction" | "type" | "location" | "price" | "bedrooms" | "goldenVisa" | "size" | "bathrooms" | "condition" | "features" | "year" | null;

export type FilterState = {
  transaction: string;
  propertyTypes: string[];
  location: string;
  priceMin: string;
  priceMax: string;
  bedrooms: string;
  goldenVisa: boolean;
  sizeMin: string;
  sizeMax: string;
  bathrooms: string;
  conditions: string[];
  features: string[];
  yearMin: string;
  yearMax: string;
};

// ─── Constants ──────────────────────────────────────────────────────────────

const INITIAL: FilterState = {
  transaction: "", propertyTypes: [], location: "",
  priceMin: "", priceMax: "", bedrooms: "", goldenVisa: false,
  sizeMin: "", sizeMax: "", bathrooms: "",
  conditions: [], features: [], yearMin: "", yearMax: "",
};

const TRANSACTIONS  = ["Buy", "Rent", "Antiparochi"];
const PROPERTY_TYPES = ["Apartment", "Maisonette", "House", "Villa", "Land", "Commercial", "Investment"];
const LOCATIONS      = ["Athens Centre", "Glyfada", "Kifisia", "Kolonaki", "Piraeus", "Santorini", "Thessaloniki"];
const BEDROOMS_OPTS  = ["1+", "2+", "3+", "4+", "5+"];
const BATHROOMS_OPTS = ["1+", "2+", "3+", "4+"];
const CONDITIONS     = ["Renovated", "Needs renovation", "Under construction"];
const FEATURES       = ["Parking", "Pool", "Sea View", "Garden", "Furnished", "Investment"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPillLabel(key: Exclude<PillKey, "more" | null>, f: FilterState): string {
  switch (key) {
    case "transaction": return f.transaction || "Transaction";
    case "type":
      if (!f.propertyTypes.length) return "Property Type";
      if (f.propertyTypes.length === 1) return f.propertyTypes[0];
      return `Type (${f.propertyTypes.length})`;
    case "location": return f.location || "Location";
    case "price":
      if (!f.priceMin && !f.priceMax) return "Price";
      if (f.priceMin && f.priceMax) return `€${f.priceMin}k – €${f.priceMax}k`;
      return f.priceMin ? `From €${f.priceMin}k` : `Up to €${f.priceMax}k`;
    case "bedrooms": return f.bedrooms ? `${f.bedrooms} Beds` : "Bedrooms";
  }
}

function toggleMulti(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

// ─── Shared input style ─────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  height: 38, border: "1px solid #D9D9D9", borderRadius: 8,
  padding: "0 12px", fontSize: 14, color: "#1E1E1E",
  width: "100%", outline: "none", boxSizing: "border-box",
};

// ─── Global CSS (hover without JS events) ──────────────────────────────────

const STYLES = `
  .fp{height:42px;border-radius:21px;border:none;background:#D9D9D9;color:#3A2E4F;padding:0 16px;
    font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;
    white-space:nowrap;flex-shrink:0;transition:background .15s,color .15s}
  .fp:hover{background:#C8C8C8}
  .fp-on{background:#3A2E4F!important;color:#D9D9D9!important}
  .fs{height:42px;border-radius:21px;border:none;background:#1E1E1E;color:#C1121F;
    padding:0 28px;font-size:14px;font-weight:600;cursor:pointer;flex-shrink:0;transition:background .15s}
  .fs:hover{background:#3A2E4F}
  .chip{height:34px;border-radius:17px;border:1px solid #D9D9D9;background:#FFFFFF;
    color:#3A2E4F;font-size:13px;cursor:pointer;padding:0 14px;flex-shrink:0;transition:background .15s}
  .chip:hover{background:#F0EFF6}
  .chip-on{background:#3A2E4F!important;color:#D9D9D9!important;border-color:#3A2E4F!important}
  .lopt{height:36px;border-radius:8px;border:none;background:transparent;color:#1E1E1E;
    font-size:14px;cursor:pointer;text-align:left;padding:0 10px;width:100%;transition:background .1s}
  .lopt:hover{background:#EBEBEB}
  .lopt-on{background:#3A2E4F!important;color:#D9D9D9!important}
  .abtn{width:100%;display:flex;align-items:center;justify-content:space-between;
    padding:11px 0;background:none;border:none;cursor:pointer;font-size:14px;font-weight:500;
    color:#1E1E1E;border-bottom:1px solid #E8E8E8;transition:color .15s}
  .abtn:hover{color:#3A2E4F}
  .mfbtn{height:36px;border-radius:18px;border:none;background:#D9D9D9;color:#3A2E4F;
    padding:0 16px;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;
    gap:6px;transition:background .15s}
  .mfbtn:hover{background:#C8C8C8}
  .mfbtn-on{background:#3A2E4F!important;color:#D9D9D9!important}
  .mob-filters-btn{height:42px;border-radius:21px;border:1px solid #D9D9D9;background:#D9D9D9;
    color:#3A2E4F;padding:0 20px;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px}
  .mob-filters-btn:hover{background:#C8C8C8}
  .mob-close{background:none;border:none;cursor:pointer;color:#1E1E1E;font-size:26px;line-height:1;padding:0 2px}
  .mob-close:hover{opacity:.6}
  .mob-apply{flex:2;height:44px;border-radius:22px;border:none;background:#3A2E4F;color:#D9D9D9;
    font-size:15px;font-weight:600;cursor:pointer}
  .mob-apply:hover{background:#1E1E1E}
  .mob-clear{flex:1;height:44px;border-radius:22px;border:1px solid #D9D9D9;background:#FFFFFF;
    color:#1E1E1E;font-size:15px;font-weight:500;cursor:pointer}
  .mob-clear:hover{background:#F0F0F0}
`;

// ─── Inline expanded panel (Row 1) ──────────────────────────────────────────

const PANEL: React.CSSProperties = {
  background: "#F4F4F4",
  border: "1px solid #E4E4E4",
  borderRadius: 12,
  padding: "16px 20px",
  marginTop: 8,
};

function RowOnePanel({
  openPill, filter, setFilter,
}: {
  openPill: PillKey;
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
}) {
  if (!openPill || openPill === "more") return null;

  return (
    <div style={PANEL}>
      {openPill === "transaction" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TRANSACTIONS.map(opt => (
            <button key={opt} type="button"
              className={`chip${filter.transaction === opt ? " chip-on" : ""}`}
              onClick={() => setFilter(f => ({ ...f, transaction: f.transaction === opt ? "" : opt }))}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {openPill === "type" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PROPERTY_TYPES.map(opt => (
            <button key={opt} type="button"
              className={`chip${filter.propertyTypes.includes(opt) ? " chip-on" : ""}`}
              onClick={() => setFilter(f => ({ ...f, propertyTypes: toggleMulti(f.propertyTypes, opt) }))}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {openPill === "location" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button"
            className={`chip${!filter.location ? " chip-on" : ""}`}
            onClick={() => setFilter(f => ({ ...f, location: "" }))}>
            Any
          </button>
          {LOCATIONS.map(opt => (
            <button key={opt} type="button"
              className={`chip${filter.location === opt ? " chip-on" : ""}`}
              onClick={() => setFilter(f => ({ ...f, location: opt }))}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {openPill === "price" && (
        <div style={{ maxWidth: 320 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888" }}>Price range (€ thousands)</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" placeholder="Min" value={filter.priceMin}
              onChange={e => setFilter(f => ({ ...f, priceMin: e.target.value }))} style={INP} />
            <input type="number" placeholder="Max" value={filter.priceMax}
              onChange={e => setFilter(f => ({ ...f, priceMax: e.target.value }))} style={INP} />
          </div>
        </div>
      )}

      {openPill === "bedrooms" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BEDROOMS_OPTS.map(opt => (
            <button key={opt} type="button"
              className={`chip${filter.bedrooms === opt ? " chip-on" : ""}`}
              onClick={() => setFilter(f => ({ ...f, bedrooms: f.bedrooms === opt ? "" : opt }))}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── More filters inline panel ──────────────────────────────────────────────

function MorePanel({
  filter, setFilter, moreAcc, setMoreAcc,
}: {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  moreAcc: MoreAccKey;
  setMoreAcc: (k: MoreAccKey) => void;
}) {
  return (
    <div style={{ ...PANEL, marginTop: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }}>

        {/* Size */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Size (sqm)</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" placeholder="Min" value={filter.sizeMin}
              onChange={e => setFilter(f => ({ ...f, sizeMin: e.target.value }))} style={INP} />
            <input type="number" placeholder="Max" value={filter.sizeMax}
              onChange={e => setFilter(f => ({ ...f, sizeMax: e.target.value }))} style={INP} />
          </div>
        </div>

        {/* Bathrooms */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Bathrooms</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {BATHROOMS_OPTS.map(opt => (
              <button key={opt} type="button"
                className={`chip${filter.bathrooms === opt ? " chip-on" : ""}`}
                onClick={() => setFilter(f => ({ ...f, bathrooms: f.bathrooms === opt ? "" : opt }))}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Year Built */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Year Built</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" placeholder="From" value={filter.yearMin}
              onChange={e => setFilter(f => ({ ...f, yearMin: e.target.value }))} style={INP} />
            <input type="number" placeholder="To" value={filter.yearMax}
              onChange={e => setFilter(f => ({ ...f, yearMax: e.target.value }))} style={INP} />
          </div>
        </div>

      </div>

      {/* Condition — accordion */}
      <div style={{ marginTop: 16, borderTop: "1px solid #E4E4E4", paddingTop: 4 }}>
        <button type="button" className="abtn"
          onClick={() => setMoreAcc(moreAcc === "condition" ? null : "condition")}>
          Condition
          <span style={{ fontSize: 10, opacity: 0.5, transform: moreAcc === "condition" ? "rotate(180deg)" : "none", display: "inline-block" }}>▼</span>
        </button>
        {moreAcc === "condition" && (
          <div style={{ paddingTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CONDITIONS.map(opt => (
              <button key={opt} type="button"
                className={`chip${filter.conditions.includes(opt) ? " chip-on" : ""}`}
                onClick={() => setFilter(f => ({ ...f, conditions: toggleMulti(f.conditions, opt) }))}>
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Features — accordion */}
      <div style={{ borderTop: "1px solid #E4E4E4", paddingTop: 4 }}>
        <button type="button" className="abtn"
          onClick={() => setMoreAcc(moreAcc === "features" ? null : "features")}>
          Features
          <span style={{ fontSize: 10, opacity: 0.5, transform: moreAcc === "features" ? "rotate(180deg)" : "none", display: "inline-block" }}>▼</span>
        </button>
        {moreAcc === "features" && (
          <div style={{ paddingTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {FEATURES.map(opt => (
              <button key={opt} type="button"
                className={`chip${filter.features.includes(opt) ? " chip-on" : ""}`}
                onClick={() => setFilter(f => ({ ...f, features: toggleMulti(f.features, opt) }))}>
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile Accordion ───────────────────────────────────────────────────────

function MobAccordion({ title, id, open, onToggle, children }: {
  title: string; id: MobileAccKey; open: boolean;
  onToggle: (id: MobileAccKey) => void; children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: "1px solid #F0F0F0" }}>
      <button type="button" className="abtn" style={{ borderBottom: "none" }}
        onClick={() => onToggle(open ? null : id)}>
        {title}
        <span style={{ fontSize: 10, opacity: 0.5, display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  );
}

// ─── Mobile Drawer ──────────────────────────────────────────────────────────

function MobileDrawer({ open, filter, setFilter, onClose, onApply, onClear }: {
  open: boolean; filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  onClose: () => void; onApply: () => void; onClear: () => void;
}) {
  const [acc, setAcc] = useState<MobileAccKey>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(30,30,30,0.55)" }} />
      <div style={{
        position: "absolute", top: 0, right: 0, height: "100%",
        width: "min(100%, 400px)", background: "#FFFFFF",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px", borderBottom: "1px solid #F0F0F0", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1E1E1E" }}>Filters</span>
          <button type="button" className="mob-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>
          <MobAccordion title="Transaction" id="transaction" open={acc === "transaction"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TRANSACTIONS.map(opt => (
                <button key={opt} type="button"
                  className={`chip${filter.transaction === opt ? " chip-on" : ""}`}
                  onClick={() => setFilter(f => ({ ...f, transaction: f.transaction === opt ? "" : opt }))}>
                  {opt}
                </button>
              ))}
            </div>
          </MobAccordion>

          <MobAccordion title="Property Type" id="type" open={acc === "type"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PROPERTY_TYPES.map(opt => (
                <button key={opt} type="button"
                  className={`chip${filter.propertyTypes.includes(opt) ? " chip-on" : ""}`}
                  onClick={() => setFilter(f => ({ ...f, propertyTypes: toggleMulti(f.propertyTypes, opt) }))}>
                  {opt}
                </button>
              ))}
            </div>
          </MobAccordion>

          <MobAccordion title="Location" id="location" open={acc === "location"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" className={`chip${!filter.location ? " chip-on" : ""}`}
                onClick={() => setFilter(f => ({ ...f, location: "" }))}>Any</button>
              {LOCATIONS.map(opt => (
                <button key={opt} type="button"
                  className={`chip${filter.location === opt ? " chip-on" : ""}`}
                  onClick={() => setFilter(f => ({ ...f, location: opt }))}>
                  {opt}
                </button>
              ))}
            </div>
          </MobAccordion>

          <MobAccordion title="Price" id="price" open={acc === "price"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="Min €k" value={filter.priceMin}
                onChange={e => setFilter(f => ({ ...f, priceMin: e.target.value }))} style={INP} />
              <input type="number" placeholder="Max €k" value={filter.priceMax}
                onChange={e => setFilter(f => ({ ...f, priceMax: e.target.value }))} style={INP} />
            </div>
          </MobAccordion>

          <MobAccordion title="Bedrooms" id="bedrooms" open={acc === "bedrooms"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BEDROOMS_OPTS.map(opt => (
                <button key={opt} type="button"
                  className={`chip${filter.bedrooms === opt ? " chip-on" : ""}`}
                  onClick={() => setFilter(f => ({ ...f, bedrooms: f.bedrooms === opt ? "" : opt }))}>
                  {opt}
                </button>
              ))}
            </div>
          </MobAccordion>

          <MobAccordion title="Golden Visa" id="goldenVisa" open={acc === "goldenVisa"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className={`chip${!filter.goldenVisa ? " chip-on" : ""}`}
                onClick={() => setFilter(f => ({ ...f, goldenVisa: false }))}>Any</button>
              <button type="button" className={`chip${filter.goldenVisa ? " chip-on" : ""}`}
                onClick={() => setFilter(f => ({ ...f, goldenVisa: true }))}>Eligible</button>
            </div>
          </MobAccordion>

          <MobAccordion title="Size (sqm)" id="size" open={acc === "size"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="Min" value={filter.sizeMin}
                onChange={e => setFilter(f => ({ ...f, sizeMin: e.target.value }))} style={INP} />
              <input type="number" placeholder="Max" value={filter.sizeMax}
                onChange={e => setFilter(f => ({ ...f, sizeMax: e.target.value }))} style={INP} />
            </div>
          </MobAccordion>

          <MobAccordion title="Bathrooms" id="bathrooms" open={acc === "bathrooms"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BATHROOMS_OPTS.map(opt => (
                <button key={opt} type="button"
                  className={`chip${filter.bathrooms === opt ? " chip-on" : ""}`}
                  onClick={() => setFilter(f => ({ ...f, bathrooms: f.bathrooms === opt ? "" : opt }))}>
                  {opt}
                </button>
              ))}
            </div>
          </MobAccordion>

          <MobAccordion title="Condition" id="condition" open={acc === "condition"} onToggle={setAcc}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CONDITIONS.map(opt => (
                <button key={opt} type="button"
                  className={`chip${filter.conditions.includes(opt) ? " chip-on" : ""}`}
                  onClick={() => setFilter(f => ({ ...f, conditions: toggleMulti(f.conditions, opt) }))}>
                  {opt}
                </button>
              ))}
            </div>
          </MobAccordion>

          <MobAccordion title="Features" id="features" open={acc === "features"} onToggle={setAcc}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FEATURES.map(opt => (
                <button key={opt} type="button"
                  className={`chip${filter.features.includes(opt) ? " chip-on" : ""}`}
                  onClick={() => setFilter(f => ({ ...f, features: toggleMulti(f.features, opt) }))}>
                  {opt}
                </button>
              ))}
            </div>
          </MobAccordion>

          <MobAccordion title="Year Built" id="year" open={acc === "year"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="From" value={filter.yearMin}
                onChange={e => setFilter(f => ({ ...f, yearMin: e.target.value }))} style={INP} />
              <input type="number" placeholder="To" value={filter.yearMax}
                onChange={e => setFilter(f => ({ ...f, yearMax: e.target.value }))} style={INP} />
            </div>
          </MobAccordion>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 12, padding: "16px 20px", borderTop: "1px solid #F0F0F0", flexShrink: 0 }}>
          <button type="button" className="mob-clear" onClick={onClear}>Clear</button>
          <button type="button" className="mob-apply" onClick={onApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function HorizontalFilter() {
  const [openPill, setOpenPill] = useState<PillKey>(null);
  const [moreAcc, setMoreAcc] = useState<MoreAccKey>(null);
  const [filter, setFilter] = useState<FilterState>(INITIAL);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click / ESC
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPill(null);
      }
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpenPill(null); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  function togglePill(key: Exclude<PillKey, null>) {
    setOpenPill(prev => prev === key ? null : key);
    if (key !== "more") setMoreAcc(null);
  }

  const handleApply = useCallback(() => {
    setDrawerOpen(false);
    console.log("Filter:", filter);
  }, [filter]);

  const handleClear = useCallback(() => setFilter(INITIAL), []);

  return (
    <section style={{ backgroundColor: "#FFFFFF", width: "100%", borderBottom: "1px solid #F0F0F0" }}>
      <style>{STYLES}</style>

      {/* ── Mobile ── */}
      {isMobile && (
        <div style={{ padding: "12px 16px" }}>
          <button type="button" className="mob-filters-btn" onClick={() => setDrawerOpen(true)}>
            Filters <span style={{ fontSize: 11, opacity: 0.5 }}>▾</span>
          </button>
          <MobileDrawer
            open={drawerOpen} filter={filter} setFilter={setFilter}
            onClose={() => setDrawerOpen(false)} onApply={handleApply} onClear={handleClear}
          />
        </div>
      )}

      {/* ── Desktop ── */}
      {!isMobile && (
        <div ref={containerRef} style={{ maxWidth: 1360, margin: "0 auto", padding: "20px 24px 24px" }}>

          {/* Row 1 — primary pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>

            <button type="button" data-testid="filterTransaction"
              className={`fp${openPill === "transaction" ? " fp-on" : ""}`}
              onClick={() => togglePill("transaction")}>
              {getPillLabel("transaction", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            <button type="button" data-testid="filterPropertyType"
              className={`fp${openPill === "type" ? " fp-on" : ""}`}
              onClick={() => togglePill("type")}>
              {getPillLabel("type", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            <button type="button" data-testid="filterLocation"
              className={`fp${openPill === "location" ? " fp-on" : ""}`}
              onClick={() => togglePill("location")}>
              {getPillLabel("location", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            <button type="button" data-testid="filterPrice"
              className={`fp${openPill === "price" ? " fp-on" : ""}`}
              onClick={() => togglePill("price")}>
              {getPillLabel("price", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            <button type="button" data-testid="filterBedrooms"
              className={`fp${openPill === "bedrooms" ? " fp-on" : ""}`}
              onClick={() => togglePill("bedrooms")}>
              {getPillLabel("bedrooms", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            {/* Golden Visa — direct toggle, no expansion */}
            <button type="button" data-testid="filterGoldenVisa"
              className={`fp${filter.goldenVisa ? " fp-on" : ""}`}
              onClick={() => setFilter(f => ({ ...f, goldenVisa: !f.goldenVisa }))}>
              Golden Visa{filter.goldenVisa ? " ✓" : ""}
            </button>

            <div style={{ flex: 1 }} />

            <button type="button" data-testid="filterSearch" className="fs"
              onClick={() => console.log("Filter:", filter)}>
              Search
            </button>
          </div>

          {/* Row 1 — inline expanded panel */}
          <RowOnePanel openPill={openPill} filter={filter} setFilter={setFilter} />

          {/* Row 2 — More... */}
          <div style={{ marginTop: 10 }}>
            <button type="button" data-testid="filterMore"
              className={`mfbtn${openPill === "more" ? " mfbtn-on" : ""}`}
              onClick={() => togglePill("more")}>
              More… <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>
          </div>

          {/* Row 2 — More inline panel */}
          {openPill === "more" && (
            <MorePanel
              filter={filter} setFilter={setFilter}
              moreAcc={moreAcc} setMoreAcc={setMoreAcc}
            />
          )}

        </div>
      )}
    </section>
  );
}
