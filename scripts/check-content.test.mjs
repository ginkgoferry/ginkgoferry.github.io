import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkContent } from './check-content.mjs';

test('content check reports source-content integrity issues', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-content-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const posts = path.join(root, 'src/content/posts');
  fs.mkdirSync(posts, { recursive: true });
  fs.writeFileSync(path.join(posts, 'Post.md'), [
    '---',
    "title: 'Duplicate'",
    'pubDate: 2026-08-12',
    'updatedDate: 2026-08-11',
    '---',
    '![missing](/images/missing.png)',
  ].join('\n'));
  fs.writeFileSync(path.join(posts, 'post.mdx'), [
    '---',
    "title: 'duplicate'",
    'pubDate: 2026-08-12',
    '---',
    '![ok](/images/also-missing.png)',
  ].join('\n'));

  const result = checkContent(root);
  assert.equal(result.posts, 2);
  assert.equal(result.errors.length, 5);
  assert.ok(result.errors.some((error) => error.includes('slug 冲突')));
  assert.ok(result.errors.some((error) => error.includes('不存在的图片')));
  assert.ok(result.errors.some((error) => error.includes('标题重复')));
  assert.ok(result.errors.some((error) => error.includes('早于 pubDate')));
});
