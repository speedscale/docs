import React, { useEffect, useRef } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import "../../search/search.css";
import "./styles.css";

export default function SiteSearch() {
  const { siteConfig } = useDocusaurusContext();
  const base = useBaseUrl("/");
  const search = siteConfig.customFields?.search || {};
  useEffect(() => {
    import("../../search/search-element");
  }, []);
  return (
    <site-search
      data-engine-version={search.version}
      data-bundle={`${base}pagefind/pagefind.js`}
      data-primary-base={base}
      data-secondary-bundle={search.websiteBundle}
      data-secondary-base={search.websiteBase}
      data-website-base={search.websiteBase}
      data-local-section="Docs"
      data-index-weight="3"
      data-secondary-weight="1"
    >
      <p className="search-loading">Loading search...</p>
    </site-search>
  );
}

export function SearchDialog() {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    let trigger;
    let overflow;
    const open = () => {
      if (dialog.open) return;
      trigger = document.activeElement;
      overflow = document.documentElement.style.overflow;
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
      dialog.querySelector("input")?.focus();
    };
    const onClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const plain =
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
      if (event.target.closest("[data-search-trigger]") && plain) {
        event.preventDefault();
        open();
      }
      if (
        event.target.closest("[data-close-search]") ||
        event.target === dialog
      )
        dialog.close();
      // Same-page anchor results do not unload the page; skip focus restore so the jump is kept.
      if (
        plain &&
        dialog.open &&
        dialog.contains(event.target.closest("a[href]"))
      ) {
        trigger = undefined;
        dialog.close();
      }
    };
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
      if (event.key === "Escape" && dialog.open) {
        event.preventDefault();
        dialog.close();
      }
    };
    const onClose = () => {
      document.documentElement.style.overflow = overflow || "";
      trigger?.focus();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    dialog.addEventListener("close", onClose);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      dialog.removeEventListener("close", onClose);
      if (dialog.open) onClose();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      id="site-search-dialog"
      aria-label="Search Speedscale"
      data-pagefind-ignore
    >
      <SiteSearch />
    </dialog>
  );
}
