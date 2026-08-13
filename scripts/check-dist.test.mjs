import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkDist, xmlError } from './check-dist.mjs';

test('xmlError accepts balanced XML and rejects mismatched tags', () => {
  assert.equal(xmlError('<?xml version="1.0"?><feed><entry /></feed>'), null);
  assert.match(xmlError('<feed><entry></feed>'), /不匹配/);
});

test('dist check reports broken internal links and malformed feeds', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-dist-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dist = path.join(root, 'dist');
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), '<a href="/missing/">broken</a>');
  fs.writeFileSync(path.join(dist, 'rss.xml'), '<rss><channel></rss>');
  fs.writeFileSync(path.join(dist, 'atom.xml'), '<feed></feed>');

  const result = checkDist(root);
  assert.ok(result.errors.some((error) => error.includes('站内资源')));
  assert.ok(result.errors.some((error) => error.includes('XML 无效')));
});
