"use client";

import { useState } from "react";

const PROPERTY_TYPES = ["Any", "Apartment", "Villa", "House", "Land"];
const LOCATIONS = ["Any", "Athens", "Piraeus", "Glyfada", "Santorini"];
const PRICE_RANGES = ["Any", "€0–200k", "€200k–500k", "€500k–1M", "€1M+"];
const BEDROOMS = ["Any", "1+", "2+", "3+", "4+"];

const selectStyle: React.CSSProperties = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #D9D9D9",
  borderRadius: 14,
  color: "#1E1E1E",
  fontSize: 15,
  height: 48,
  padding: "0 14px",
  width: "100%",
  appearance: "none",
  cursor: "pointer",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 12,
  color: "#404040",
  fontWeight: 500,
  flex: 1,
  minWidth: 140,
};

export default function HorizontalFilter() {
  const [propertyType, setPropertyType] = useState("Any");
  const [location, setLocation] = useState("Any");
  const [priceRange, setPriceRange] = useState("Any");
  const [bedrooms, setBedrooms] = useState("Any");

  function handleSearch() {
    console.log({ propertyType, location, priceRange, bedrooms });
  }

  return (
    <section style={{ backgroundColor: "#FFFFFF", width: "100%" }}>
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "32px 24px",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "flex-end",
        }}
      >
        {/* Property Type */}
        <label style={labelStyle}>
          <span>Property Type</span>
          <select
            data-testid="propertyTypeSelect"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            style={selectStyle}
          >
            {PROPERTY_TYPES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

        {/* Location */}
        <label style={labelStyle}>
          <span>Location</span>
          <select
            data-testid="locationSelect"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={selectStyle}
          >
            {LOCATIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

        {/* Price Range */}
        <label style={labelStyle}>
          <span>Price Range</span>
          <select
            data-testid="priceRangeSelect"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            style={selectStyle}
          >
            {PRICE_RANGES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

        {/* Bedrooms */}
        <label style={labelStyle}>
          <span>Bedrooms</span>
          <select
            data-testid="bedroomsSelect"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            style={selectStyle}
          >
            {BEDROOMS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

        {/* Search button */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 140, flex: "0 0 auto" }}>
          <span style={{ fontSize: 12, color: "transparent", userSelect: "none" }}>Search</span>
          <button
            type="button"
            data-testid="searchButton"
            onClick={handleSearch}
            style={{
              backgroundColor: "#1E1E1E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 14,
              height: 48,
              padding: "0 32px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              width: "100%",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3A2E4F")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1E1E1E")}
          >
            Search
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          [data-filter-row] label,
          [data-filter-row] > div {
            flex: 1 1 100% !important;
            min-width: unset !important;
          }
        }
      `}</style>
    </section>
  );
}
