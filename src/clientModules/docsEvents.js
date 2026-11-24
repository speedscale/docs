// Named analytics events for the two start paths on the home page and for
// the first replay or report step of each path. Pageviews alone do not show
// which start a reader chose or whether they got as far as running a replay.
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

// A step counts as reached when the reader copies from the section under
// `anchor` on `path`: the copy button or a manual copy of selected text.
const STEPS = [
  { path: '/proxymock/getting-started/quickstart/quickstart-cli', anchor: 'run-mocks', step: 'first_replay', start: 'local' },
  { path: '/proxymock/agent-tutorial/regression-test', anchor: 'prompt', step: 'first_replay', start: 'local_agent' },
  { path: '/proxymock/agent-tutorial-cluster/replay-the-tests', anchor: 'prompt', step: 'first_report', start: 'cluster_agent' },
  { path: '/getting-started/tutorial', anchor: 'replay', step: 'first_report', start: 'dashboard' },
];

const sent = new Set();

function send(event, props) {
  const key = `${event}|${JSON.stringify(props)}|${window.location.pathname}`;
  if (sent.has(key)) return;
  sent.add(key);
  // PostHog is loaded by Google Tag Manager and may be blocked or still loading.
  if (window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture(event, props);
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...props });
}

const trimSlash = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

// The id of the h2 that the node sits under, or null.
function sectionAnchor(node) {
  let el = node && node.nodeType === 1 ? node : node && node.parentElement;
  const root = el && el.closest('.theme-doc-markdown');
  if (!root) return null;
  while (el && el.parentElement !== root) el = el.parentElement;
  for (; el; el = el.previousElementSibling) {
    if (el.tagName === 'H2') return el.id || null;
  }
  return null;
}

function stepFor(node) {
  const path = trimSlash(window.location.pathname);
  const anchor = sectionAnchor(node);
  return STEPS.find((s) => s.path === path && s.anchor === anchor);
}

if (ExecutionEnvironment.canUseDOM) {
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      const start = target.closest('[data-docs-start]');
      if (start) {
        send('docs_start_selected', {
          start: start.getAttribute('data-docs-start'),
          link: start.getAttribute('data-docs-link') || 'primary',
        });
        return;
      }
      // The code block copy button; the word-wrap toggle sits beside it.
      const button = target.closest('.theme-code-block button');
      if (button && /copy/i.test(button.getAttribute('aria-label') || '')) {
        const s = stepFor(target);
        if (s) send('docs_step_reached', { step: s.step, start: s.start });
      }
    },
    true,
  );
  document.addEventListener('copy', () => {
    const sel = window.getSelection();
    const s = sel && sel.anchorNode ? stepFor(sel.anchorNode) : null;
    if (s) send('docs_step_reached', { step: s.step, start: s.start });
  });
}
