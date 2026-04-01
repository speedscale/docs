import React from 'react';
import styles from './ProxymockLanguageWorkflow.module.css';

const CommandBlock = ({ command }) => (
  <pre className={styles.commandBlock}>
    <code>{command}</code>
  </pre>
);

const Step = ({ index, title, command, note }) => (
  <li className={styles.step}>
    <div className={styles.stepTitle}>
      {index + 1}. {title}
    </div>
    {command ? <CommandBlock command={command} /> : null}
    {note ? <p className={styles.note}>{note}</p> : null}
  </li>
);

const ProxymockLanguageWorkflow = ({ intro, steps }) => {
  return (
    <section className={styles.workflow}>
      {intro ? <p>{intro}</p> : null}
      <ol className={styles.stepList}>
        {steps.map((step, index) => (
          <Step key={step.title} index={index} {...step} />
        ))}
      </ol>
    </section>
  );
};

export default ProxymockLanguageWorkflow;
