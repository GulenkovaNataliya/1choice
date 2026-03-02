"use client";

import { useState, useRef, useEffect } from "react";

type PopoverKey = "transaction" | "type" | "location" | "price" | "bedrooms" | "more" | null;

type FilterState = {
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

const INITIAL: FilterState = {
  transaction: "",
  propertyTypes: [],
  location: "",
  priceMin: "",
  priceMax: "",
  bedrooms: "",
  goldenVisa: false,
  sizeMin: "",
  sizeMax: "",
  bathrooms: "",
  conditions: [],
  features: [],
  yearMin: "",
  yearMax: "",
};

const TRANSACTIONS = ["Buy", "Rent", "Antiparochi"];
const PROPERTY_TYPES = ["Apartment", "Maisonette", "House", "Villa", "Land", "Commercial", "Investment"];
const LOCATIONS = ["Athens Centre", "Glyfada", "Kifisia", "Kolonaki", "Piraeus", "Santorini", "Thessaloniki"];
const BEDROOMS_OPTS = ["1+", "2+", "3+", "4+", "5+"];
const BATHROOMS_OPTS = ["1+", "2+", "3+", "4+"];
const CONDITIONS = ["Renovated", "Needs renovation", "Under construction"];
const FEATURES = ["Parking", "Pool", "Sea View", "Garden", "Furnished", "Investment"];

function getPillLabel(key: "transaction" | "type" | "location" | "price" | "bedrooms", f: FilterState): string {
  switch (key) {
    case "transaction": return f.transaction || "Transaction";
    case "type":
      if (f.propertyTypes.length === 0) return "Property Type";
      if (f.propertyTypes.length === 1) return f.propertyTypes[0];
      return `Type (${f.propertyTypes.length})`;
    case "location": return f.location || "Location";
    case "price":
      if (!f.priceMin && !f.priceMax) return "Price";
      if (f.priceMin && f.priceMax) return `€${f.priceMin}k – €${f.priceMax}k`;
      if (f.priceMin) return `From €${f.priceMin}k`;
      return `Up to €${f.priceMax}k`;
    case "bedrooms": return f.bedrooms ? `${f.bedrooms} Beds` : "Bedrooms";
  }
}

function isFilterActive(key: string, f: FilterState): boolean {
  switch (key) {
    case "transaction": return !!f.transaction;
    case "type": return f.propertyTypes.length > 0;
    case "location": return !!f.location;
    case "price": return !!(f.priceMin || f.priceMax);
    case "bedrooms": return !!f.bedrooms;
    default: return false;
  }
}

function toggleMulti(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
}

function pill(open: boolean, active: boolean): React.CSSProperties {
  return {
    height: 42,
    borderRadius: 21,
    border: `1px solid ${open || active ? "#C1121F" : "#D9D9D9"}`,
    background: "#FFFFFF",
    color: "#1E1E1E",
    padding: "0 16px",
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "border-color 0.15s",
  };
}

const POPOVER: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  left: 0,
  zIndex: 200,
  backgroundColor: "#FFFFFF",
  border: "1px solid #E0E0E0",
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  padding: "16px",
  minWidth: 280,
};

const INPUT: React.CSSProperties = {
  height: 38,
  border: "1px solid #D9D9D9",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 14,
  color: "#1E1E1E",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

function ListBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 38,
        borderRadius: 8,
        border: "none",
        background: active ? "#1E1E1E" : "transparent",
        color: active ? "#F4F4F4" : "#1E1E1E",
        fontSize: 14,
        cursor: "pointer",
        textAlign: "left",
        padding: "0 12px",
        width: "100%",
      }}
    >
      {label}
    </button>
  );
}

function ChipBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 36,
        borderRadius: 18,
        border: `1px solid ${active ? "#C1121F" : "#D9D9D9"}`,
        background: active ? "#1E1E1E" : "#FFFFFF",
        color: active ? "#F4F4F4" : "#1E1E1E",
        fontSize: 13,
        cursor: "pointer",
        padding: "0 12px",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

export default function HorizontalFilter() {
  const [openPopover, setOpenPopover] = useState<PopoverKey>(null);
  const [filter, setFilter] = useState<FilterState>(INITIAL);
  const containerRef = useRef<HTMLDivElement>(null);

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

  function toggle(key: Exclude<PopoverKey, null>) {
    setOpenPopover(prev => (prev === key ? null : key));
  }

  function handleSearch() {
    console.log("Filter state:", filter);
  }

  return (
    <section style={{ backgroundColor: "#FFFFFF", width: "100%", borderBottom: "1px solid #F0F0F0" }}>
      <div
        ref={containerRef}
        style={{ maxWidth: 1360, margin: "0 auto", padding: "20px 24px" }}
      >
        {/* Row 1 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>

          {/* Transaction */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              data-testid="filterTransaction"
              onClick={() => toggle("transaction")}
              style={pill(openPopover === "transaction", isFilterActive("transaction", filter))}
            >
              {getPillLabel("transaction", filter)}
              <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>
            {openPopover === "transaction" && (
              <div data-testid="popover-transaction" style={POPOVER}>
                {TRANSACTIONS.map(opt => (
                  <ListBtn
                    key={opt}
                    label={opt}
                    active={filter.transaction === opt}
                    onClick={() => {
                      setFilter(f => ({ ...f, transaction: f.transaction === opt ? "" : opt }));
                      setOpenPopover(null);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Property Type */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              data-testid="filterPropertyType"
              onClick={() => toggle("type")}
              style={pill(openPopover === "type", isFilterActive("type", filter))}
            >
              {getPillLabel("type", filter)}
              <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>
            {openPopover === "type" && (
              <div data-testid="popover-type" style={POPOVER}>
                {PROPERTY_TYPES.map(opt => (
                  <ListBtn
                    key={opt}
                    label={opt}
                    active={filter.propertyTypes.includes(opt)}
                    onClick={() =>
                      setFilter(f => ({ ...f, propertyTypes: toggleMulti(f.propertyTypes, opt) }))
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              data-testid="filterLocation"
              onClick={() => toggle("location")}
              style={pill(openPopover === "location", isFilterActive("location", filter))}
            >
              {getPillLabel("location", filter)}
              <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>
            {openPopover === "location" && (
              <div data-testid="popover-location" style={POPOVER}>
                <ListBtn
                  label="Any"
                  active={!filter.location}
                  onClick={() => { setFilter(f => ({ ...f, location: "" })); setOpenPopover(null); }}
                />
                {LOCATIONS.map(opt => (
                  <ListBtn
                    key={opt}
                    label={opt}
                    active={filter.location === opt}
                    onClick={() => { setFilter(f => ({ ...f, location: opt })); setOpenPopover(null); }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Price */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              data-testid="filterPrice"
              onClick={() => toggle("price")}
              style={pill(openPopover === "price", isFilterActive("price", filter))}
            >
              {getPillLabel("price", filter)}
              <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>
            {openPopover === "price" && (
              <div data-testid="popover-price" style={{ ...POPOVER, minWidth: 300 }}>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888" }}>Price range (€ thousands)</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filter.priceMin}
                    onChange={e => setFilter(f => ({ ...f, priceMin: e.target.value }))}
                    style={INPUT}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filter.priceMax}
                    onChange={e => setFilter(f => ({ ...f, priceMax: e.target.value }))}
                    style={INPUT}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setOpenPopover(null)}
                  style={{
                    marginTop: 12, width: "100%", height: 38, borderRadius: 8,
                    background: "#1E1E1E", color: "#F4F4F4", border: "none",
                    fontSize: 14, cursor: "pointer",
                  }}
                >Apply</button>
              </div>
            )}
          </div>

          {/* Bedrooms */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              data-testid="filterBedrooms"
              onClick={() => toggle("bedrooms")}
              style={pill(openPopover === "bedrooms", isFilterActive("bedrooms", filter))}
            >
              {getPillLabel("bedrooms", filter)}
              <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>
            {openPopover === "bedrooms" && (
              <div data-testid="popover-bedrooms" style={POPOVER}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {BEDROOMS_OPTS.map(opt => (
                    <ChipBtn
                      key={opt}
                      label={opt}
                      active={filter.bedrooms === opt}
                      onClick={() => setFilter(f => ({ ...f, bedrooms: f.bedrooms === opt ? "" : opt }))}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Golden Visa toggle */}
          <button
            type="button"
            data-testid="filterGoldenVisa"
            onClick={() => setFilter(f => ({ ...f, goldenVisa: !f.goldenVisa }))}
            style={{
              ...pill(false, filter.goldenVisa),
              background: filter.goldenVisa ? "#1E1E1E" : "#FFFFFF",
              color: filter.goldenVisa ? "#F4F4F4" : "#1E1E1E",
            }}
          >
            Golden Visa{filter.goldenVisa ? " ✓" : ""}
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Search */}
          <button
            type="button"
            data-testid="filterSearch"
            onClick={handleSearch}
            style={{
              height: 42,
              borderRadius: 21,
              border: "none",
              background: "#1E1E1E",
              color: "#F4F4F4",
              padding: "0 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#3A2E4F"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#1E1E1E"; }}
          >
            Search
          </button>
        </div>

        {/* Row 2 — More Filters */}
        <div style={{ marginTop: 12, display: "flex" }}>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              data-testid="filterMore"
              onClick={() => toggle("more")}
              style={{
                height: 36,
                borderRadius: 18,
                border: `1px solid ${openPopover === "more" ? "#C1121F" : "#D9D9D9"}`,
                background: "transparent",
                color: "#404040",
                padding: "0 16px",
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              More Filters
              <span style={{ fontSize: 9, opacity: 0.4 }}>▾</span>
            </button>

            {openPopover === "more" && (
              <div
                data-testid="popover-more"
                style={{ ...POPOVER, minWidth: 340, maxHeight: "70vh", overflowY: "auto" }}
              >
                {/* Size */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Size (sqm)</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="number" placeholder="Min" value={filter.sizeMin}
                      onChange={e => setFilter(f => ({ ...f, sizeMin: e.target.value }))}
                      style={INPUT} />
                    <input type="number" placeholder="Max" value={filter.sizeMax}
                      onChange={e => setFilter(f => ({ ...f, sizeMax: e.target.value }))}
                      style={INPUT} />
                  </div>
                </div>

                {/* Bathrooms */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Bathrooms</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {BATHROOMS_OPTS.map(opt => (
                      <ChipBtn key={opt} label={opt} active={filter.bathrooms === opt}
                        onClick={() => setFilter(f => ({ ...f, bathrooms: f.bathrooms === opt ? "" : opt }))} />
                    ))}
                  </div>
                </div>

                {/* Condition */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Condition</p>
                  {CONDITIONS.map(opt => (
                    <ListBtn key={opt} label={opt} active={filter.conditions.includes(opt)}
                      onClick={() => setFilter(f => ({ ...f, conditions: toggleMulti(f.conditions, opt) }))} />
                  ))}
                </div>

                {/* Features */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Features</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {FEATURES.map(opt => (
                      <ChipBtn key={opt} label={opt} active={filter.features.includes(opt)}
                        onClick={() => setFilter(f => ({ ...f, features: toggleMulti(f.features, opt) }))} />
                    ))}
                  </div>
                </div>

                {/* Year Built */}
                <div style={{ marginBottom: 8 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#1E1E1E" }}>Year Built</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="number" placeholder="From" value={filter.yearMin}
                      onChange={e => setFilter(f => ({ ...f, yearMin: e.target.value }))}
                      style={INPUT} />
                    <input type="number" placeholder="To" value={filter.yearMax}
                      onChange={e => setFilter(f => ({ ...f, yearMax: e.target.value }))}
                      style={INPUT} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenPopover(null)}
                  style={{
                    marginTop: 12, width: "100%", height: 38, borderRadius: 8,
                    background: "#1E1E1E", color: "#F4F4F4", border: "none",
                    fontSize: 14, cursor: "pointer",
                  }}
                >Apply</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
