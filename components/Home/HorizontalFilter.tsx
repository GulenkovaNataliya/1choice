"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LOCATIONS, LOCATION_GROUPS } from "@/components/Data/locations";

// ─── Types ──────────────────────────────────────────────────────────────────

type Row1Key = "transaction" | "type" | "location" | "price" | "bedrooms";
type Row2Key = "features" | "bathrooms" | "size" | "yearBuilt" | "condition";
type PanelKey = Row1Key | Row2Key | null;
type MobileAccKey = Row1Key | Row2Key | "goldenVisa" | null;

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

const TRANSACTIONS   = ["Buy", "Rent", "Antiparochi"];
const PROPERTY_TYPES = ["Apartment", "Maisonette", "House", "Villa", "Land", "Commercial", "Investment"];
const BEDROOMS_OPTS  = ["1+", "2+", "3+", "4+", "5+"];
const BATHROOMS_OPTS = ["1+", "2+", "3+", "4+"];
const CONDITIONS     = ["Renovated", "Needs renovation", "Under construction"];
const FEATURES       = ["Parking", "Pool", "Sea View", "Garden", "Furnished", "Investment"];

const ROW1_KEYS: Row1Key[] = ["transaction", "type", "location", "price", "bedrooms"];
const ROW2_KEYS: Row2Key[] = ["features", "bathrooms", "size", "yearBuilt", "condition"];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getPillLabel(key: PanelKey, f: FilterState): string {
  if (!key) return "";
  switch (key) {
    case "transaction": return f.transaction || "Transaction";
    case "type":
      if (!f.propertyTypes.length) return "Property Type";
      if (f.propertyTypes.length === 1) return f.propertyTypes[0];
      return `Type (${f.propertyTypes.length})`;
    case "location": {
      if (!f.location) return "Location";
      return LOCATIONS.find(l => l.slug === f.location)?.label ?? f.location;
    }
    case "price":
      if (!f.priceMin && !f.priceMax) return "Price";
      if (f.priceMin && f.priceMax) return `€${f.priceMin}k – €${f.priceMax}k`;
      return f.priceMin ? `From €${f.priceMin}k` : `Up to €${f.priceMax}k`;
    case "bedrooms": return f.bedrooms ? `${f.bedrooms} Beds` : "Bedrooms";
    case "features": return f.features.length ? `Features (${f.features.length})` : "Features";
    case "bathrooms": return f.bathrooms ? `${f.bathrooms} Baths` : "Bathrooms";
    case "size":
      if (!f.sizeMin && !f.sizeMax) return "Size (sqm)";
      if (f.sizeMin && f.sizeMax) return `${f.sizeMin}–${f.sizeMax} sqm`;
      return f.sizeMin ? `From ${f.sizeMin} sqm` : `Up to ${f.sizeMax} sqm`;
    case "yearBuilt":
      if (!f.yearMin && !f.yearMax) return "Year Built";
      if (f.yearMin && f.yearMax) return `${f.yearMin}–${f.yearMax}`;
      return f.yearMin ? `From ${f.yearMin}` : `Until ${f.yearMax}`;
    case "condition": return f.conditions.length ? `Condition (${f.conditions.length})` : "Condition";
    default: return "";
  }
}

function toggleMulti(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

function hasValue(key: PanelKey, f: FilterState): boolean {
  switch (key) {
    case "transaction": return f.transaction !== "";
    case "type":        return f.propertyTypes.length > 0;
    case "location":    return f.location !== "";
    case "price":       return f.priceMin !== "" || f.priceMax !== "";
    case "bedrooms":    return f.bedrooms !== "";
    case "features":    return f.features.length > 0;
    case "bathrooms":   return f.bathrooms !== "";
    case "size":        return f.sizeMin !== "" || f.sizeMax !== "";
    case "yearBuilt":   return f.yearMin !== "" || f.yearMax !== "";
    case "condition":   return f.conditions.length > 0;
    default:            return false;
  }
}

// ─── URL param builder ───────────────────────────────────────────────────────

const FEATURE_SLUG: Record<string, string> = {
  "Parking": "parking", "Pool": "pool", "Sea View": "seaview",
  "Garden": "garden", "Furnished": "furnished", "Investment": "investment",
};

const CONDITION_SLUG: Record<string, string> = {
  "Renovated": "renovated",
  "Needs renovation": "needsrenovation",
  "Under construction": "underconstruction",
};

function buildParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();

  if (f.transaction)        p.set("transaction", f.transaction.toLowerCase());
  if (f.propertyTypes.length)
    p.set("type", f.propertyTypes.map(t => t.toLowerCase()).join(","));
  if (f.location)
    p.set("location", f.location);
  if (f.priceMin)           p.set("priceMin", f.priceMin);
  if (f.priceMax)           p.set("priceMax", f.priceMax);
  if (f.bedrooms)           p.set("bedrooms", f.bedrooms.replace("+", ""));
  if (f.goldenVisa)         p.set("gv", "1");

  if (f.features.length)
    p.set("features", f.features.map(v => FEATURE_SLUG[v] ?? v.toLowerCase()).join(","));
  if (f.bathrooms)          p.set("baths", f.bathrooms.replace("+", ""));
  if (f.sizeMin)            p.set("sizeMin", f.sizeMin);
  if (f.sizeMax)            p.set("sizeMax", f.sizeMax);
  if (f.yearMin)            p.set("yearMin", f.yearMin);
  if (f.yearMax)            p.set("yearMax", f.yearMax);
  if (f.conditions.length)
    p.set("condition", f.conditions.map(v => CONDITION_SLUG[v] ?? v.toLowerCase()).join(","));

  return p;
}

// ─── Shared input style ──────────────────────────────────────────────────────

const INP: React.CSSProperties = {
  height: 38, border: "1px solid #D9D9D9", borderRadius: 8,
  padding: "0 12px", fontSize: 14, color: "#1E1E1E",
  background: "#F4F4F4",
  width: "100%", outline: "none", boxSizing: "border-box",
};

// ─── Global CSS (hover without JS events) ───────────────────────────────────

const STYLES = `
  .fp{height:42px;border-radius:21px;border:none;background:#D9D9D9;color:#3A2E4F;
    padding:0 20px;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;
    justify-content:center;gap:6px;white-space:nowrap;flex-shrink:0;min-width:150px;
    transition:background .15s,color .15s}
  .fp:hover{background:#C8C8C8}
  .fp-on{background:#3A2E4F!important;color:#D9D9D9!important}
  .fs{height:42px;border-radius:16px;border:1px solid #C1121F;background:#D9D9D9;color:#C1121F;
    padding:0 28px;font-size:14px;font-weight:600;cursor:pointer;flex-shrink:0;
    transition:background .15s,color .15s,border-color .15s}
  .fs:hover{background:#3A2E4F;border-color:#3A2E4F;color:#D9D9D9}
  .fs:active{background:#3A2E4F;border-color:#3A2E4F;color:#D9D9D9}
  .fc{height:42px;border-radius:21px;border:1px solid #D9D9D9;background:transparent;
    color:#3A2E4F;padding:0 20px;font-size:14px;cursor:pointer;flex-shrink:0;
    transition:border-color .15s,color .15s}
  .fc:hover{border-color:#C1121F;color:#C1121F}
  .fp-more{color:#C1121F!important}
  .fp-more.fp-on{background:#3A2E4F!important;color:#F4F4F4!important}
  .fp-inp::placeholder{color:#404040}
  .chip{height:34px;border-radius:17px;border:1px solid #D9D9D9;background:#FFFFFF;
    color:#3A2E4F;font-size:13px;cursor:pointer;padding:0 14px;flex-shrink:0;
    transition:background .15s}
  .chip:hover{background:#F0EFF6}
  .chip-on{background:#3A2E4F!important;color:#D9D9D9!important;border-color:#3A2E4F!important}
  .abtn{width:100%;display:flex;align-items:center;justify-content:space-between;
    padding:11px 0;background:none;border:none;cursor:pointer;font-size:14px;font-weight:500;
    color:#1E1E1E;border-bottom:1px solid #E8E8E8;transition:color .15s}
  .abtn:hover{color:#3A2E4F}
  .mob-filters-btn{height:42px;border-radius:21px;border:1px solid #D9D9D9;background:#D9D9D9;
    color:#3A2E4F;padding:0 20px;font-size:14px;cursor:pointer;display:inline-flex;
    align-items:center;gap:8px}
  .mob-filters-btn:hover{background:#C8C8C8}
  .mob-close{background:none;border:none;cursor:pointer;color:#1E1E1E;font-size:26px;
    line-height:1;padding:0 2px}
  .mob-close:hover{opacity:.6}
  .mob-apply{flex:2;height:44px;border-radius:22px;border:none;background:#3A2E4F;
    color:#D9D9D9;font-size:15px;font-weight:600;cursor:pointer}
  .mob-apply:hover{background:#1E1E1E}
  .mob-clear{flex:1;height:44px;border-radius:22px;border:1px solid #D9D9D9;
    background:#FFFFFF;color:#1E1E1E;font-size:15px;font-weight:500;cursor:pointer}
  .mob-clear:hover{background:#F0F0F0}
`;

// ─── Inline panel ────────────────────────────────────────────────────────────

const PANEL_STYLE: React.CSSProperties = {
  background: "#F4F4F4",
  border: "1px solid #E4E4E4",
  borderRadius: 12,
  padding: "16px 20px",
  marginTop: 8,
  height: 120,
  overflowY: "auto",
};

function InlinePanel({ openPanel, filter, setFilter, onClose }: {
  openPanel: PanelKey;
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  onClose: () => void;
}) {
  if (!openPanel) return null;
  return (
    <div style={PANEL_STYLE}>
      {openPanel === "transaction" && (
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
      {openPanel === "type" && (
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
      {openPanel === "location" && (
        <div>
          <div style={{ marginBottom: 10 }}>
            <button type="button"
              className={`chip${!filter.location ? " chip-on" : ""}`}
              onClick={() => { setFilter(f => ({ ...f, location: "" })); onClose(); }}>
              Any
            </button>
          </div>
          {LOCATION_GROUPS.map(group => (
            <div key={group} style={{ marginBottom: 10 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#AAAAAA",
                textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6,
              }}>
                {group}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {LOCATIONS.filter(l => l.group === group).map(loc => (
                  <button key={loc.slug} type="button"
                    className={`chip${filter.location === loc.slug ? " chip-on" : ""}`}
                    onClick={() => { setFilter(f => ({ ...f, location: loc.slug })); onClose(); }}>
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {openPanel === "price" && (
        <div style={{ maxWidth: 320 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888" }}>Price range (€ thousands)</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" placeholder="Min" value={filter.priceMin}
              data-testid="filterInputMin" className="fp-inp bg-[#F4F4F4]"
              onChange={e => setFilter(f => ({ ...f, priceMin: e.target.value }))} style={INP} />
            <input type="number" placeholder="Max" value={filter.priceMax}
              className="fp-inp bg-[#F4F4F4]"
              onChange={e => setFilter(f => ({ ...f, priceMax: e.target.value }))} style={INP} />
          </div>
        </div>
      )}
      {openPanel === "bedrooms" && (
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
      {openPanel === "features" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FEATURES.map(opt => (
            <button key={opt} type="button"
              className={`chip${filter.features.includes(opt) ? " chip-on" : ""}`}
              onClick={() => setFilter(f => ({ ...f, features: toggleMulti(f.features, opt) }))}>
              {opt}
            </button>
          ))}
        </div>
      )}
      {openPanel === "bathrooms" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BATHROOMS_OPTS.map(opt => (
            <button key={opt} type="button"
              className={`chip${filter.bathrooms === opt ? " chip-on" : ""}`}
              onClick={() => setFilter(f => ({ ...f, bathrooms: f.bathrooms === opt ? "" : opt }))}>
              {opt}
            </button>
          ))}
        </div>
      )}
      {openPanel === "size" && (
        <div style={{ maxWidth: 320 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888" }}>Size range (sqm)</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" placeholder="Min" value={filter.sizeMin}
              className="fp-inp bg-[#F4F4F4]"
              onChange={e => setFilter(f => ({ ...f, sizeMin: e.target.value }))} style={INP} />
            <input type="number" placeholder="Max" value={filter.sizeMax}
              className="fp-inp bg-[#F4F4F4]"
              onChange={e => setFilter(f => ({ ...f, sizeMax: e.target.value }))} style={INP} />
          </div>
        </div>
      )}
      {openPanel === "yearBuilt" && (
        <div style={{ maxWidth: 320 }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888" }}>Year built</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" placeholder="From" value={filter.yearMin}
              className="fp-inp bg-[#F4F4F4]"
              onChange={e => setFilter(f => ({ ...f, yearMin: e.target.value }))} style={INP} />
            <input type="number" placeholder="To" value={filter.yearMax}
              className="fp-inp bg-[#F4F4F4]"
              onChange={e => setFilter(f => ({ ...f, yearMax: e.target.value }))} style={INP} />
          </div>
        </div>
      )}
      {openPanel === "condition" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
  );
}

// ─── Mobile Accordion ────────────────────────────────────────────────────────

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

// ─── Mobile Drawer ───────────────────────────────────────────────────────────

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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px", borderBottom: "1px solid #F0F0F0", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1E1E1E" }}>Filters</span>
          <button type="button" className="mob-close" onClick={onClose}>×</button>
        </div>

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
            <div>
              <div style={{ marginBottom: 8 }}>
                <button type="button" className={`chip${!filter.location ? " chip-on" : ""}`}
                  onClick={() => setFilter(f => ({ ...f, location: "" }))}>Any</button>
              </div>
              {LOCATION_GROUPS.map(group => (
                <div key={group} style={{ marginBottom: 10 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: "#AAAAAA",
                    textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6,
                  }}>
                    {group}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {LOCATIONS.filter(l => l.group === group).map(loc => (
                      <button key={loc.slug} type="button"
                        className={`chip${filter.location === loc.slug ? " chip-on" : ""}`}
                        onClick={() => setFilter(f => ({ ...f, location: loc.slug }))}>
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </MobAccordion>

          <MobAccordion title="Price" id="price" open={acc === "price"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="Min €k" value={filter.priceMin}
                className="fp-inp bg-[#F4F4F4]"
                onChange={e => setFilter(f => ({ ...f, priceMin: e.target.value }))} style={INP} />
              <input type="number" placeholder="Max €k" value={filter.priceMax}
                className="fp-inp bg-[#F4F4F4]"
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

          <MobAccordion title="Size (sqm)" id="size" open={acc === "size"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="Min" value={filter.sizeMin}
                className="fp-inp bg-[#F4F4F4]"
                onChange={e => setFilter(f => ({ ...f, sizeMin: e.target.value }))} style={INP} />
              <input type="number" placeholder="Max" value={filter.sizeMax}
                className="fp-inp bg-[#F4F4F4]"
                onChange={e => setFilter(f => ({ ...f, sizeMax: e.target.value }))} style={INP} />
            </div>
          </MobAccordion>

          <MobAccordion title="Year Built" id="yearBuilt" open={acc === "yearBuilt"} onToggle={setAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="From" value={filter.yearMin}
                className="fp-inp bg-[#F4F4F4]"
                onChange={e => setFilter(f => ({ ...f, yearMin: e.target.value }))} style={INP} />
              <input type="number" placeholder="To" value={filter.yearMax}
                className="fp-inp bg-[#F4F4F4]"
                onChange={e => setFilter(f => ({ ...f, yearMax: e.target.value }))} style={INP} />
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
        </div>

        <div style={{ display: "flex", gap: 12, padding: "16px 20px", borderTop: "1px solid #F0F0F0", flexShrink: 0 }}>
          <button type="button" className="mob-clear" onClick={onClear}>Clear</button>
          <button type="button" className="mob-apply" onClick={onApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

type Props = {
  /** Pre-populate filter state from URL params (used on /properties). */
  initialFilter?: Partial<FilterState>;
  /** When provided, called on Search/Clear instead of router.push (caller handles URL update). */
  onSearch?: (params: URLSearchParams) => void;
};

export default function HorizontalFilter({ initialFilter, onSearch }: Props = {}) {
  const router = useRouter();
  const [openPanel, setOpenPanel] = useState<PanelKey>(null);
  const [showMore, setShowMore] = useState(false);
  const [filter, setFilter] = useState<FilterState>({ ...INITIAL, ...initialFilter });
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click / ESC
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpenPanel(null); }
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

  // Sync filter state when initialFilter changes externally (URL updated via chips / back-forward)
  const initKey = JSON.stringify(initialFilter ?? null);
  const prevInitKey = useRef(initKey);
  useEffect(() => {
    if (prevInitKey.current === initKey) return;
    prevInitKey.current = initKey;
    setFilter({ ...INITIAL, ...initialFilter });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initKey]);

  // DEBUG — remove after verification
  useEffect(() => {
    const moreCls = `fp fp-more${showMore ? " fp-on" : ""}`;
    console.log("[Filter] More className:", moreCls);
    console.log("[Filter] Search className: fs  (border-radius: 16px, background: #D9D9D9)");
  }, [showMore]);

  function togglePanel(key: PanelKey) {
    setOpenPanel(prev => prev === key ? null : key);
  }

  function toggleMore() {
    const next = !showMore;
    setShowMore(next);
    // Close any open Row 2 panel when hiding Row 2
    if (!next && openPanel && (ROW2_KEYS as string[]).includes(openPanel)) {
      setOpenPanel(null);
    }
  }

  const handleApply = useCallback(() => {
    setDrawerOpen(false);
    console.log("Filter:", filter);
  }, [filter]);

  const handleClear = useCallback(() => {
    setFilter(INITIAL);
    setOpenPanel(null);
    setShowMore(false);
    if (onSearch) onSearch(new URLSearchParams());
  }, [onSearch]);

  const row1PanelOpen = openPanel !== null && (ROW1_KEYS as string[]).includes(openPanel);
  const row2PanelOpen = openPanel !== null && (ROW2_KEYS as string[]).includes(openPanel);

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

          {/* Row 1 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button type="button" data-testid="filterTransaction"
              className={`fp${(openPanel === "transaction" || hasValue("transaction", filter)) ? " fp-on" : ""}`}
              onClick={() => togglePanel("transaction")}>
              {getPillLabel("transaction", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            <button type="button" data-testid="filterPropertyType"
              className={`fp${(openPanel === "type" || hasValue("type", filter)) ? " fp-on" : ""}`}
              onClick={() => togglePanel("type")}>
              {getPillLabel("type", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            <button type="button" data-testid="filterLocation"
              className={`fp${(openPanel === "location" || hasValue("location", filter)) ? " fp-on" : ""}`}
              onClick={() => togglePanel("location")}>
              {getPillLabel("location", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            <button type="button" data-testid="filterPrice"
              className={`fp${(openPanel === "price" || hasValue("price", filter)) ? " fp-on" : ""}`}
              onClick={() => togglePanel("price")}>
              {getPillLabel("price", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            <button type="button" data-testid="filterBedrooms"
              className={`fp${(openPanel === "bedrooms" || hasValue("bedrooms", filter)) ? " fp-on" : ""}`}
              onClick={() => togglePanel("bedrooms")}>
              {getPillLabel("bedrooms", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            {/* Golden Visa — direct toggle, no panel */}
            <button type="button" data-testid="filterGoldenVisa"
              className={`fp${filter.goldenVisa ? " fp-on" : ""}`}
              onClick={() => setFilter(f => ({ ...f, goldenVisa: !f.goldenVisa }))}>
              Golden Visa{filter.goldenVisa ? " ✓" : ""}
            </button>

            {/* More... — toggles Row 2 */}
            <button type="button" data-testid="filterMore"
              className={`fp fp-more${showMore ? " fp-on" : ""}`}
              onClick={toggleMore}>
              More… <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            <div style={{ flex: 1 }} />

            <button type="button" data-testid="filterClear" className="fc"
              onClick={handleClear}>
              Clear
            </button>

            <button type="button" data-testid="filterSearch" className="fs"
              style={{
                backgroundColor: "#D9D9D9",
                color: "#C1121F",
                border: "1px solid #C1121F",
                borderRadius: "16px",
              }}
              onClick={() => {
                const p = buildParams(filter);
                if (onSearch) {
                  onSearch(p);
                } else {
                  const qs = p.toString();
                  router.push(`/properties${qs ? `?${qs}` : ""}`);
                }
              }}>
              Search
            </button>
          </div>

          {/* Row 1 inline panel */}
          {row1PanelOpen && (
            <InlinePanel openPanel={openPanel} filter={filter} setFilter={setFilter} onClose={() => setOpenPanel(null)} />
          )}

          {/* Row 2 — only when More... is active */}
          {showMore && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <button type="button" data-testid="filterFeatures"
                  className={`fp${(openPanel === "features" || hasValue("features", filter)) ? " fp-on" : ""}`}
                  onClick={() => togglePanel("features")}>
                  {getPillLabel("features", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
                </button>

                <button type="button" data-testid="filterBathrooms"
                  className={`fp${(openPanel === "bathrooms" || hasValue("bathrooms", filter)) ? " fp-on" : ""}`}
                  onClick={() => togglePanel("bathrooms")}>
                  {getPillLabel("bathrooms", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
                </button>

                <button type="button" data-testid="filterSize"
                  className={`fp${(openPanel === "size" || hasValue("size", filter)) ? " fp-on" : ""}`}
                  onClick={() => togglePanel("size")}>
                  {getPillLabel("size", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
                </button>

                <button type="button" data-testid="filterYearBuilt"
                  className={`fp${(openPanel === "yearBuilt" || hasValue("yearBuilt", filter)) ? " fp-on" : ""}`}
                  onClick={() => togglePanel("yearBuilt")}>
                  {getPillLabel("yearBuilt", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
                </button>

                <button type="button" data-testid="filterCondition"
                  className={`fp${(openPanel === "condition" || hasValue("condition", filter)) ? " fp-on" : ""}`}
                  onClick={() => togglePanel("condition")}>
                  {getPillLabel("condition", filter)} <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
                </button>
              </div>

              {/* Row 2 inline panel */}
              {row2PanelOpen && (
                <InlinePanel openPanel={openPanel} filter={filter} setFilter={setFilter} onClose={() => setOpenPanel(null)} />
              )}
            </div>
          )}

        </div>
      )}
    </section>
  );
}
