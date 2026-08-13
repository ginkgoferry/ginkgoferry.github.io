import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./publish.mjs', import.meta.url));

test('publish --no-draft turns an existing draft into a published post', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-publish-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const postsDir = path.join(root, 'src/content/posts');
  const source = path.join(root, 'draft.md');
  fs.mkdirSync(postsDir, { recursive: true });
  fs.writeFileSync(source, [
    '---',
    "title: 'Draft post'",
    'pubDate: 2026-08-11',
    'tags: []',
    'draft: true',
    '---',
    '',
    'Draft body.',
  ].join('\n'));
  fs.copyFileSync(source, path.join(postsDir, 'draft-post.md'));

  execFileSync(
    process.execPath,
    [script, source, '--slug', 'draft-post', '--force', '--no-draft'],
    {
      env: { ...process.env, BLOG_PUBLISH_ROOT: root },
      stdio: 'pipe',
    },
  );

  const published = fs.readFileSync(path.join(postsDir, 'draft-post.md'), 'utf8');
  assert.match(published, /^draft: false$/m);
  assert.match(published, /^updatedDate: \d{4}-\d{2}-\d{2}$/m);
  assert.doesNotMatch(published, /^draft: true$/m);
});
