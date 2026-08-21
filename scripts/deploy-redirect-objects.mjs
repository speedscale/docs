#!/usr/bin/env node
// Turn the client-redirect stubs in build/ into real 301s on the S3 website
// endpoint. @docusaurus/plugin-client-redirects emits each redirect as a 200
// HTML page with a meta refresh, which Google refuses to treat as a redirect
// ("Page with redirect" in Search Console). Overwriting the same key with a
// zero-byte object carrying x-amz-website-redirect-location makes the website
// endpoint answer 301 instead.
//
// Runs after `aws s3 sync --delete`, which re-uploads the stubs each deploy —
// so this must run on every deploy too.
//
// Usage: deploy-redirect-objects.mjs <build-dir> <bucket> [--dry-run]

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const [buildDir, bucket] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");

if (!buildDir || !bucket) {
  console.error("usage: deploy-redirect-objects.mjs <build-dir> <bucket> [--dry-run]");
  process.exit(2);
}

// A client-redirect stub is a small HTML file whose head is a meta refresh.
// Real docs pages never carry http-equiv="refresh".
const STUB_RE = /<meta\s+http-equiv="refresh"\s+content="0;\s*url=([^"]+)"/;

const stubs = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (entry.endsWith(".html") && st.size < 4096) {
      const m = readFileSync(p, "utf-8").match(STUB_RE);
      if (m) stubs.push([path.relative(buildDir, p), m[1]]);
    }
  }
};
walk(buildDir);

if (stubs.length === 0) {
  // The plugin emitting zero stubs means the build layout changed under us.
  console.error("no redirect stubs found in build output — layout changed?");
  process.exit(1);
}

// Every target here becomes an x-amz-website-redirect-location, which S3 will
// serve as a 301 to wherever it points — including off-site. All of our
// configured redirects are site-relative, so anything else means the build
// produced something we did not intend; fail rather than publish an open
// redirect on docs.speedscale.com. Note "//host" is protocol-relative and
// leaves the origin, so a leading-slash check alone is not enough.
const offsite = stubs.filter(
  ([, target]) => !target.startsWith("/") || target.startsWith("//"),
);
if (offsite.length > 0) {
  console.error("refusing to publish non-relative redirect targets:");
  for (const [key, target] of offsite) console.error(`  ${key} -> ${target}`);
  process.exit(1);
}

console.log(`${stubs.length} redirect stubs -> 301 objects in s3://${bucket}`);

let failed = 0;
// Modest parallelism: batches of 8 concurrent put-object calls.
for (let i = 0; i < stubs.length; i += 8) {
  const batch = stubs.slice(i, i + 8).map(async ([key, target]) => {
    if (dryRun) {
      console.log(`(dry-run) ${key} -> ${target}`);
      return;
    }
    try {
      execFileSync("aws", [
        "s3api", "put-object",
        "--bucket", bucket,
        "--key", key,
        "--website-redirect-location", target,
        "--content-type", "text/html; charset=utf-8",
        "--cache-control", "public, max-age=300",
      ], { stdio: ["ignore", "ignore", "inherit"] });
      console.log(`301: ${key} -> ${target}`);
    } catch {
      console.error(`FAILED: ${key}`);
      failed += 1;
    }
  });
  await Promise.all(batch);
}

if (failed > 0) {
  console.error(`${failed} uploads failed`);
  process.exit(1);
}
