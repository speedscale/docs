import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Tinypool from 'tinypool';

test('SSG pool options support repeated tasks and ignore inherited worker filenames', async t => {
  const dir = await mkdtemp(path.join(tmpdir(), 'docs-ssg-pool-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const filename = path.join(dir, 'worker.cjs');
  const inherited = path.join(dir, 'inherited.cjs');
  await writeFile(filename, "const { workerData } = require('node:worker_threads');\nmodule.exports = task => ({ id: task.id, label: workerData[1].label });\n");
  await writeFile(inherited, "module.exports = () => 'inherited worker';\n");
  const pool = new Tinypool({
    filename, minThreads: 2, maxThreads: 2, concurrentTasksPerWorker: 1,
    runtime: 'worker_threads', isolateWorkers: false,
    workerData: { label: 'docs' }, maxMemoryLimitBeforeRecycle: 1_000_000_000,
    resourceLimits: {},
  });
  t.after(() => pool.destroy());
  for (let id = 1; id <= 4; id++) {
    const result = await pool.run({ id }, Object.create({ filename: inherited }));
    assert.deepEqual(result, { id, label: 'docs' });
  }
});
