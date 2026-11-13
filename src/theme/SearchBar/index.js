import React, {useEffect} from 'react';
import SearchBar from '@theme-original/SearchBar';

function exposeSearchDialog(container) {
  // DocSearch 4 exposes its modal as a button containing interactive controls.
  if (container.getAttribute('role') === 'button') {
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    container.removeAttribute('aria-expanded');
    container.removeAttribute('tabindex');
  }
}

export default function SearchBarWrapper(props) {
  useEffect(() => {
    const selector = '.DocSearch-Container';
    document.querySelectorAll(selector).forEach(exposeSearchDialog);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            if (node.matches(selector)) {
              exposeSearchDialog(node);
            }
            node.querySelectorAll(selector).forEach(exposeSearchDialog);
          }
        }
      }
    });
    // DocSearch renders its portal outside the search bar's React subtree.
    observer.observe(document.body, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, []);

  return <SearchBar {...props} />;
}
