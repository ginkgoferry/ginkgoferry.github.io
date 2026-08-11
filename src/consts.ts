export const SITE_TITLE = 'ginkgoferry';
export const SITE_DESCRIPTION = 'A hand-drawn notebook about code and everything else.';
export const AUTHOR = 'ginkgoferry';
// UI 文案用英文；文章内容（中文）由霞鹜文楷接管
export const LOCALE = 'en-US';

// 侧栏 logo 下面那句话
export const SITE_MOTTO = 'Never odd or even.';

// 首页 hero 的兴趣贴纸
export const FOCUS_TAGS = ['distributed systems', 'deep learning'];

export const NAV_LINKS = [
  { href: '/', label: 'home' },
  { href: '/posts/', label: 'posts' },
  { href: '/tags/', label: 'tags' },
  { href: '/archives/', label: 'archives' },
] as const;

export const SOCIAL_LINKS = [
  { href: 'https://github.com/ginkgoferry', label: 'GitHub' },
  { href: 'mailto:zehaochen@smail.nju.edu.cn', label: 'Email' },
] as const;
