import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkContent } from './check-content.mjs';

test('content check reports missing images and case-insensitive slug conflicts', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-content-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const posts = path.join(root, 'src/content/posts');
  fs.mkdirSync(posts, { recursive: true });
  fs.writeFileSync(path.join(posts, 'Post.md'), '![missing](/images/missing.png)');
  fs.writeFileSync(path.join(posts, 'post.mdx'), '# duplicate');

  const result = checkContent(root);
  assert.equal(result.posts, 2);
  assert.equal(result.errors.length, 2);
  assert.ok(result.errors.some((error) => error.includes('slug 冲突')));
  assert.ok(result.errors.some((error) => error.includes('不存在的图片')));
});
