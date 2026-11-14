import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import "../../components/SiteSearch/styles.css";

export default function SearchBar() {
  return (
    <a
      className="docs-search-trigger"
      href={useBaseUrl("/search/")}
      data-search-trigger
      aria-label="Search"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <span>Search</span>
      <kbd>{"\u2318"} K</kbd>
    </a>
  );
}
