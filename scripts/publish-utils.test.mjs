import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findMarkdownImages,
  localDateString,
  updateFrontmatter,
} from './publish-utils.mjs';

test('localDateString uses the local calendar date', () => {
  const date = new Date(2026, 7, 13, 0, 30);
  assert.equal(localDateString(date), '2026-08-13');
});

test('findMarkdownImages accepts spaces, narrow spaces, angle brackets and titles', () => {
  const source = [
    '![a](screen shot.png)',
    '![b](screen\u202fshot.png)',
    '![c](<folder/screen shot.png> "preview")',
    '![d](screenshot (1).png)',
  ].join('\n');

  assert.deepEqual(
    findMarkdownImages(source).map(({ alt, destination }) => ({ alt, destination })),
    [
      { alt: 'a', destination: 'screen shot.png' },
      { alt: 'b', destination: 'screen\u202fshot.png' },
      { alt: 'c', destination: 'folder/screen shot.png' },
      { alt: 'd', destination: 'screenshot (1).png' },
    ],
  );
});

test('updateFrontmatter replaces, inserts and removes fields', () => {
  const source = "---\ntitle: 'Old'\npubDate: 2026-08-11\ncategory: 'old'\ntags: []\n---\n";
  const actual = updateFrontmatter(source, {
    title: "'New'",
    category: null,
    tags: "['one', 'two']",
    updatedDate: '2026-08-13',
  });

  assert.equal(
    actual,
    "---\ntitle: 'New'\npubDate: 2026-08-11\ntags: ['one', 'two']\nupdatedDate: 2026-08-13\n---\n",
  );
});
