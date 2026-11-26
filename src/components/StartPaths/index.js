import React from 'react';
import Link from '@docusaurus/Link';

// data-docs-start is read by src/clientModules/docsEvents.js.
const paths = [
  {
    start: 'local',
    title: 'On your machine',
    body: 'Record a service, mock its dependencies and replay the traffic with the proxymock CLI. No cluster is needed, and this is the shortest route to a first replay.',
    to: '/proxymock/getting-started/quickstart/quickstart-cli/',
    cta: 'Run a first local replay',
    more: [
      { label: 'What proxymock is', to: '/proxymock/' },
      { label: 'Tutorial with a coding agent', to: '/proxymock/agent-tutorial/' },
    ],
  },
  {
    start: 'cluster',
    title: 'In your cluster',
    body: 'Plan an evaluation on Kubernetes or another shared environment. The checklist covers the service to pick, access, data handling and success criteria, and where captured traffic is stored, including your own cloud (BYOC).',
    to: '/getting-started/evaluation/',
    cta: 'Plan a cluster evaluation',
    more: [
      { label: 'Keep traffic in your own cloud (BYOC)', to: '/byoc/' },
      { label: 'Cluster tutorial with a coding agent', to: '/proxymock/agent-tutorial-cluster/' },
    ],
  },
];

export default function StartPaths() {
  return (
    <div className="row margin-top--md">
      {paths.map((p) => (
        <div key={p.start} className="col col--6 margin-bottom--lg">
          <div className="card shadow--md" style={{ height: '100%' }}>
            <div className="card__header">
              <h3 style={{ margin: 0 }}>{p.title}</h3>
            </div>
            <div className="card__body">
              <p>{p.body}</p>
              <ul>
                {p.more.map((m) => (
                  <li key={m.to}>
                    <Link to={m.to} data-docs-start={p.start} data-docs-link="secondary">{m.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card__footer">
              <Link className="button button--primary button--block" to={p.to} data-docs-start={p.start} data-docs-link="primary">
                {p.cta}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
