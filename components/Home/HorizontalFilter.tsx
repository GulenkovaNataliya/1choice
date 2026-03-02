"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PopoverKey = "transaction" | "type" | "location" | "price" | "bedrooms" | "more" | null;
type AccordionKey = "transaction" | "type" | "location" | "price" | "bedrooms" | "goldenVisa" | "size" | "bathrooms" | "condition" | "features" | "year" | null;

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

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL: FilterState = {
  transaction: "", propertyTypes: [], location: "",
  priceMin: "", priceMax: "", bedrooms: "", goldenVisa: false,
  sizeMin: "", sizeMax: "", bathrooms: "",
  conditions: [], features: [], yearMin: "", yearMax: "",
};

const TRANSACTIONS = ["Buy", "Rent", "Antiparochi"];
const PROPERTY_TYPES = ["Apartment", "Maisonette", "House", "Villa", "Land", "Commercial", "Investment"];
const LOCATIONS = ["Athens Centre", "Glyfada", "Kifisia", "Kolonaki", "Piraeus", "Santorini", "Thessaloniki"];
const BEDROOMS_OPTS = ["1+", "2+", "3+", "4+", "5+"];
const BATHROOMS_OPTS = ["1+", "2+", "3+", "4+"];
const CONDITIONS = ["Renovated", "Needs renovation", "Under construction"];
const FEATURES = ["Parking", "Pool", "Sea View", "Garden", "Furnished", "Investment"];

// ─── Style helpers ────────────────────────────────────────────────────────────

function pillStyle(open: boolean, active: boolean): React.CSSProperties {
  return {
    height: 42, borderRadius: 21,
    border: `1px solid ${open || active ? "#C1121F" : "#D9D9D9"}`,
    background: "#FFFFFF", color: "#1E1E1E",
    padding: "0 16px", fontSize: 14, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6,
    whiteSpace: "nowrap", flexShrink: 0, transition: "border-color 0.15s",
  };
}

const POPOVER_STYLE: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 200,
  backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0",
  borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  padding: "16px", minWidth: 280,
};

const INPUT_STYLE: React.CSSProperties = {
  height: 38, border: "1px solid #D9D9D9", borderRadius: 8,
  padding: "0 12px", fontSize: 14, color: "#1E1E1E",
  width: "100%", outline: "none", boxSizing: "border-box",
};

// ─── Shared sub-components ────────────────────────────────────────────────────

function ListBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      height: 38, borderRadius: 8, border: "none",
      background: active ? "#1E1E1E" : "transparent",
      color: active ? "#F4F4F4" : "#1E1E1E",
      fontSize: 14, cursor: "pointer", textAlign: "left",
      padding: "0 12px", width: "100%",
    }}>
      {label}
    </button>
  );
}

function ChipBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      height: 36, borderRadius: 18,
      border: `1px solid ${active ? "#C1121F" : "#D9D9D9"}`,
      background: active ? "#1E1E1E" : "#FFFFFF",
      color: active ? "#F4F4F4" : "#1E1E1E",
      fontSize: 13, cursor: "pointer", padding: "0 12px", flexShrink: 0,
    }}>
      {label}
    </button>
  );
}

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

function getPillLabel(key: "transaction" | "type" | "location" | "price" | "bedrooms", f: FilterState): string {
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

function isActive(key: string, f: FilterState): boolean {
  switch (key) {
    case "transaction": return !!f.transaction;
    case "type": return f.propertyTypes.length > 0;
    case "location": return !!f.location;
    case "price": return !!(f.priceMin || f.priceMax);
    case "bedrooms": return !!f.bedrooms;
    default: return false;
  }
}

// ─── Accordion (mobile drawer) ────────────────────────────────────────────────

function Accordion({
  title, id, open, onToggle, children,
}: {
  title: string; id: AccordionKey; open: boolean;
  onToggle: (id: AccordionKey) => void; children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: "1px solid #F0F0F0" }}>
      <button
        type="button"
        onClick={() => onToggle(open ? null : id)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "14px 0",
          background: "none", border: "none", cursor: "pointer",
          fontSize: 15, fontWeight: 500, color: "#1E1E1E",
        }}
      >
        {title}
        <span style={{ fontSize: 11, opacity: 0.5, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 14 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────

function MobileDrawer({
  open, filter, setFilter, onClose, onApply, onClear,
}: {
  open: boolean;
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const [acc, setAcc] = useState<AccordionKey>(null);

  // ESC closes drawer
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  function toggleAcc(id: AccordionKey) { setAcc(id); }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400 }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(30,30,30,0.55)" }}
      />

      {/* Panel */}
      <div style={{
        position: "absolute", top: 0, right: 0,
        height: "100%", width: "min(100%, 400px)",
        background: "#FFFFFF", display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 20px 16px", borderBottom: "1px solid #F0F0F0", flexShrink: 0,
        }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1E1E1E" }}>Filters</span>
          <button type="button" onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22, color: "#1E1E1E", lineHeight: 1, padding: "0 4px",
          }}>×</button>
        </div>

        {/* Accordion body */}
        <div style={{ flex: 1, padding: "0 20px", overflowY: "auto" }}>

          {/* Transaction */}
          <Accordion title="Transaction" id="transaction" open={acc === "transaction"} onToggle={toggleAcc}>
            {TRANSACTIONS.map(opt => (
              <ListBtn key={opt} label={opt} active={filter.transaction === opt}
                onClick={() => setFilter(f => ({ ...f, transaction: f.transaction === opt ? "" : opt }))} />
            ))}
          </Accordion>

          {/* Property Type */}
          <Accordion title="Property Type" id="type" open={acc === "type"} onToggle={toggleAcc}>
            {PROPERTY_TYPES.map(opt => (
              <ListBtn key={opt} label={opt} active={filter.propertyTypes.includes(opt)}
                onClick={() => setFilter(f => ({ ...f, propertyTypes: toggleMulti(f.propertyTypes, opt) }))} />
            ))}
          </Accordion>

          {/* Location */}
          <Accordion title="Location" id="location" open={acc === "location"} onToggle={toggleAcc}>
            <ListBtn label="Any" active={!filter.location}
              onClick={() => setFilter(f => ({ ...f, location: "" }))} />
            {LOCATIONS.map(opt => (
              <ListBtn key={opt} label={opt} active={filter.location === opt}
                onClick={() => setFilter(f => ({ ...f, location: opt }))} />
            ))}
          </Accordion>

          {/* Price */}
          <Accordion title="Price" id="price" open={acc === "price"} onToggle={toggleAcc}>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>Price range (€ thousands)</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="Min" value={filter.priceMin}
                onChange={e => setFilter(f => ({ ...f, priceMin: e.target.value }))}
                style={INPUT_STYLE} />
              <input type="number" placeholder="Max" value={filter.priceMax}
                onChange={e => setFilter(f => ({ ...f, priceMax: e.target.value }))}
                style={INPUT_STYLE} />
            </div>
          </Accordion>

          {/* Bedrooms */}
          <Accordion title="Bedrooms" id="bedrooms" open={acc === "bedrooms"} onToggle={toggleAcc}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BEDROOMS_OPTS.map(opt => (
                <ChipBtn key={opt} label={opt} active={filter.bedrooms === opt}
                  onClick={() => setFilter(f => ({ ...f, bedrooms: f.bedrooms === opt ? "" : opt }))} />
              ))}
            </div>
          </Accordion>

          {/* Golden Visa */}
          <Accordion title="Golden Visa" id="goldenVisa" open={acc === "goldenVisa"} onToggle={toggleAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <ChipBtn label="Any" active={!filter.goldenVisa}
                onClick={() => setFilter(f => ({ ...f, goldenVisa: false }))} />
              <ChipBtn label="Eligible" active={filter.goldenVisa}
                onClick={() => setFilter(f => ({ ...f, goldenVisa: true }))} />
            </div>
          </Accordion>

          {/* Size */}
          <Accordion title="Size (sqm)" id="size" open={acc === "size"} onToggle={toggleAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="Min" value={filter.sizeMin}
                onChange={e => setFilter(f => ({ ...f, sizeMin: e.target.value }))}
                style={INPUT_STYLE} />
              <input type="number" placeholder="Max" value={filter.sizeMax}
                onChange={e => setFilter(f => ({ ...f, sizeMax: e.target.value }))}
                style={INPUT_STYLE} />
            </div>
          </Accordion>

          {/* Bathrooms */}
          <Accordion title="Bathrooms" id="bathrooms" open={acc === "bathrooms"} onToggle={toggleAcc}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BATHROOMS_OPTS.map(opt => (
                <ChipBtn key={opt} label={opt} active={filter.bathrooms === opt}
                  onClick={() => setFilter(f => ({ ...f, bathrooms: f.bathrooms === opt ? "" : opt }))} />
              ))}
            </div>
          </Accordion>

          {/* Condition */}
          <Accordion title="Condition" id="condition" open={acc === "condition"} onToggle={toggleAcc}>
            {CONDITIONS.map(opt => (
              <ListBtn key={opt} label={opt} active={filter.conditions.includes(opt)}
                onClick={() => setFilter(f => ({ ...f, conditions: toggleMulti(f.conditions, opt) }))} />
            ))}
          </Accordion>

          {/* Features */}
          <Accordion title="Features" id="features" open={acc === "features"} onToggle={toggleAcc}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FEATURES.map(opt => (
                <ChipBtn key={opt} label={opt} active={filter.features.includes(opt)}
                  onClick={() => setFilter(f => ({ ...f, features: toggleMulti(f.features, opt) }))} />
              ))}
            </div>
          </Accordion>

          {/* Year Built */}
          <Accordion title="Year Built" id="year" open={acc === "year"} onToggle={toggleAcc}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" placeholder="From" value={filter.yearMin}
                onChange={e => setFilter(f => ({ ...f, yearMin: e.target.value }))}
                style={INPUT_STYLE} />
              <input type="number" placeholder="To" value={filter.yearMax}
                onChange={e => setFilter(f => ({ ...f, yearMax: e.target.value }))}
                style={INPUT_STYLE} />
            </div>
          </Accordion>

        </div>

        {/* Footer actions */}
        <div style={{
          display: "flex", gap: 12, padding: "16px 20px",
          borderTop: "1px solid #F0F0F0", flexShrink: 0,
        }}>
          <button type="button" onClick={onClear} style={{
            flex: 1, height: 44, borderRadius: 22,
            border: "1px solid #D9D9D9", background: "#FFFFFF",
            color: "#1E1E1E", fontSize: 15, fontWeight: 500, cursor: "pointer",
          }}>Clear</button>
          <button type="button" onClick={onApply} style={{
            flex: 2, height: 44, borderRadius: 22,
            border: "none", background: "#1E1E1E",
            color: "#F4F4F4", fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function HorizontalFilter() {
  const [openPopover, setOpenPopover] = useState<PopoverKey>(null);
  const [filter, setFilter] = useState<FilterState>(INITIAL);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Desktop: outside click + ESC
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenPopover(null);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function toggle(key: Exclude<PopoverKey, null>) {
    setOpenPopover(prev => prev === key ? null : key);
  }

  function handleSearch() {
    console.log("Filter state:", filter);
  }

  const handleApply = useCallback(() => {
    setDrawerOpen(false);
    console.log("Filter state:", filter);
  }, [filter]);

  const handleClear = useCallback(() => {
    setFilter(INITIAL);
  }, []);

  return (
    <section style={{ backgroundColor: "#FFFFFF", width: "100%", borderBottom: "1px solid #F0F0F0" }}>

      {/* ── Mobile ── */}
      {isMobile && (
        <div style={{ padding: "12px 16px" }}>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            style={{
              height: 42, borderRadius: 21,
              border: "1px solid #D9D9D9",
              background: "#FFFFFF", color: "#1E1E1E",
              padding: "0 20px", fontSize: 14, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 8,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#C1121F"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#D9D9D9"; }}
          >
            Filters
            <span style={{ fontSize: 11, opacity: 0.5 }}>▾</span>
          </button>

          <MobileDrawer
            open={drawerOpen}
            filter={filter}
            setFilter={setFilter}
            onClose={() => setDrawerOpen(false)}
            onApply={handleApply}
            onClear={handleClear}
          />
        </div>
      )}

      {/* ── Desktop ── */}
      {!isMobile && (
        <div ref={containerRef} style={{ maxWidth: 1360, margin: "0 auto", padding: "20px 24px" }}>

          {/* Row 1 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>

            {/* Transaction */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button type="button" data-testid="filterTransaction"
                onClick={() => toggle("transaction")}
                style={pillStyle(openPopover === "transaction", isActive("transaction", filter))}>
                {getPillLabel("transaction", filter)}
                <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
              </button>
              {openPopover === "transaction" && (
                <div data-testid="popover-transaction" style={POPOVER_STYLE}>
                  {TRANSACTIONS.map(opt => (
                    <ListBtn key={opt} label={opt} active={filter.transaction === opt}
                      onClick={() => {
                        setFilter(f => ({ ...f, transaction: f.transaction === opt ? "" : opt }));
                        setOpenPopover(null);
                      }} />
                  ))}
                </div>
              )}
            </div>

            {/* Property Type */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button type="button" data-testid="filterPropertyType"
                onClick={() => toggle("type")}
                style={pillStyle(openPopover === "type", isActive("type", filter))}>
                {getPillLabel("type", filter)}
                <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
              </button>
              {openPopover === "type" && (
                <div data-testid="popover-type" style={POPOVER_STYLE}>
                  {PROPERTY_TYPES.map(opt => (
                    <ListBtn key={opt} label={opt} active={filter.propertyTypes.includes(opt)}
                      onClick={() => setFilter(f => ({ ...f, propertyTypes: toggleMulti(f.propertyTypes, opt) }))} />
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button type="button" data-testid="filterLocation"
                onClick={() => toggle("location")}
                style={pillStyle(openPopover === "location", isActive("location", filter))}>
                {getPillLabel("location", filter)}
                <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
              </button>
              {openPopover === "location" && (
                <div data-testid="popover-location" style={POPOVER_STYLE}>
                  <ListBtn label="Any" active={!filter.location}
                    onClick={() => { setFilter(f => ({ ...f, location: "" })); setOpenPopover(null); }} />
                  {LOCATIONS.map(opt => (
                    <ListBtn key={opt} label={opt} active={filter.location === opt}
                      onClick={() => { setFilter(f => ({ ...f, location: opt })); setOpenPopover(null); }} />
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button type="button" data-testid="filterPrice"
                onClick={() => toggle("price")}
                style={pillStyle(openPopover === "price", isActive("price", filter))}>
                {getPillLabel("price", filter)}
                <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
              </button>
              {openPopover === "price" && (
                <div data-testid="popover-price" style={{ ...POPOVER_STYLE, minWidth: 300 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888" }}>Price range (€ thousands)</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="number" placeholder="Min" value={filter.priceMin}
                      onChange={e => setFilter(f => ({ ...f, priceMin: e.target.value }))} style={INPUT_STYLE} />
                    <input type="number" placeholder="Max" value={filter.priceMax}
                      onChange={e => setFilter(f => ({ ...f, priceMax: e.target.value }))} style={INPUT_STYLE} />
                  </div>
                  <button type="button" onClick={() => setOpenPopover(null)} style={{
                    marginTop: 12, width: "100%", height: 38, borderRadius: 8,
                    background: "#1E1E1E", color: "#F4F4F4", border: "none", fontSize: 14, cursor: "pointer",
                  }}>Apply</button>
                </div>
              )}
            </div>

            {/* Bedrooms */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button type="button" data-testid="filterBedrooms"
                onClick={() => toggle("bedrooms")}
                style={pillStyle(openPopover === "bedrooms", isActive("bedrooms", filter))}>
                {getPillLabel("bedrooms", filter)}
                <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
              </button>
              {openPopover === "bedrooms" && (
                <div data-testid="popover-bedrooms" style={POPOVER_STYLE}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {BEDROOMS_OPTS.map(opt => (
                      <ChipBtn key={opt} label={opt} active={filter.bedrooms === opt}
                        onClick={() => setFilter(f => ({ ...f, bedrooms: f.bedrooms === opt ? "" : opt }))} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Golden Visa */}
            <button type="button" data-testid="filterGoldenVisa"
              onClick={() => setFilter(f => ({ ...f, goldenVisa: !f.goldenVisa }))}
              style={{
                ...pillStyle(false, filter.goldenVisa),
                background: filter.goldenVisa ? "#1E1E1E" : "#FFFFFF",
                color: filter.goldenVisa ? "#F4F4F4" : "#1E1E1E",
              }}>
              Golden Visa{filter.goldenVisa ? " ✓" : ""}
            </button>

            <div style={{ flex: 1 }} />

            {/* Search */}
            <button type="button" data-testid="filterSearch" onClick={handleSearch}
              style={{
                height: 42, borderRadius: 21, border: "none",
                background: "#1E1E1E", color: "#F4F4F4",
                padding: "0 28px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", flexShrink: 0, transition: "background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#3A2E4F"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1E1E1E"; }}>
              Search
            </button>
          </div>

          {/* Row 2 — More Filters */}
          <div style={{ marginTop: 12, display: "flex" }}>
            <div style={{ position: "relative" }}>
              <button type="button" data-testid="filterMore"
                onClick={() => toggle("more")}
                style={{
                  height: 36, borderRadius: 18,
                  border: `1px solid ${openPopover === "more" ? "#C1121F" : "#D9D9D9"}`,
                  background: "transparent", color: "#404040",
                  padding: "0 16px", fontSize: 13, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                More Filters
                <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
              </button>

              {openPopover === "more" && (
                <div data-testid="popover-more"
                  style={{ ...POPOVER_STYLE, minWidth: 340, maxHeight: "70vh", overflowY: "auto" }}>

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Size (sqm)</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type="number" placeholder="Min" value={filter.sizeMin}
                        onChange={e => setFilter(f => ({ ...f, sizeMin: e.target.value }))} style={INPUT_STYLE} />
                      <input type="number" placeholder="Max" value={filter.sizeMax}
                        onChange={e => setFilter(f => ({ ...f, sizeMax: e.target.value }))} style={INPUT_STYLE} />
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Bathrooms</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {BATHROOMS_OPTS.map(opt => (
                        <ChipBtn key={opt} label={opt} active={filter.bathrooms === opt}
                          onClick={() => setFilter(f => ({ ...f, bathrooms: f.bathrooms === opt ? "" : opt }))} />
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Condition</p>
                    {CONDITIONS.map(opt => (
                      <ListBtn key={opt} label={opt} active={filter.conditions.includes(opt)}
                        onClick={() => setFilter(f => ({ ...f, conditions: toggleMulti(f.conditions, opt) }))} />
                    ))}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Features</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {FEATURES.map(opt => (
                        <ChipBtn key={opt} label={opt} active={filter.features.includes(opt)}
                          onClick={() => setFilter(f => ({ ...f, features: toggleMulti(f.features, opt) }))} />
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Year Built</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type="number" placeholder="From" value={filter.yearMin}
                        onChange={e => setFilter(f => ({ ...f, yearMin: e.target.value }))} style={INPUT_STYLE} />
                      <input type="number" placeholder="To" value={filter.yearMax}
                        onChange={e => setFilter(f => ({ ...f, yearMax: e.target.value }))} style={INPUT_STYLE} />
                    </div>
                  </div>

                  <button type="button" onClick={() => setOpenPopover(null)} style={{
                    marginTop: 12, width: "100%", height: 38, borderRadius: 8,
                    background: "#1E1E1E", color: "#F4F4F4", border: "none", fontSize: 14, cursor: "pointer",
                  }}>Apply</button>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </section>
  );
}
