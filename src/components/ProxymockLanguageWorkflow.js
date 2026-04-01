import React from 'react';

const CommandBlock = ({ command }) => (
  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm whitespace-pre-wrap break-words">
    <code>{command}</code>
  </pre>
);

const Step = ({ index, title, command, note }) => (
  <li className="space-y-3">
    <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {index + 1}. {title}
    </div>
    {command ? <CommandBlock command={command} /> : null}
    {note ? <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{note}</p> : null}
  </li>
);

const ProxymockLanguageWorkflow = ({ intro, steps }) => {
  return (
    <section className="space-y-6">
      {intro ? <p>{intro}</p> : null}
      <ol className="space-y-6">
        {steps.map((step, index) => (
          <Step key={step.title} index={index} {...step} />
        ))}
      </ol>
    </section>
  );
};

export default ProxymockLanguageWorkflow;
