export const SITE_TITLE = 'ginkgoferry';
export const AUTHOR = 'ginkgoferry';
export const SITE_DESCRIPTION = 'A hand-drawn notebook about code and everyday things.';
// 仓库首次提交日期；站点运行天数从这个固定日期计算。
export const SITE_CREATED_DATE = '2026-08-11';
// UI 文案用英文；文章内容（中文）由霞鹜文楷接管
export const LOCALE = 'en-US';

// 侧栏 logo 下面那句话
export const SITE_MOTTO = 'Never odd or even.';

// 首页 hero 的兴趣贴纸
export const FOCUS_TAGS = ['distributed systems', 'deep learning'];

export const NAV_LINKS = [
  { href: '/', label: 'home' },
  { href: '/posts/', label: 'posts' },
  { href: '/categories/', label: 'categories' },
  { href: '/tags/', label: 'tags' },
  { href: '/archives/', label: 'archives' },
] as const;

export const SOCIAL_LINKS = [
  { href: 'https://github.com/ginkgoferry', label: 'GitHub' },
  { href: 'mailto:zehaochen@smail.nju.edu.cn', label: 'Email' },
] as const;

// 浏览量统计：goatcounter.com 注册后填你的 code（如 'ginkgoferry'），留空则关闭。
// GoatCounter 无 cookie、不追踪个人数据；需在后台开启「Allow adding visitor counts」。
export const GOATCOUNTER_ID = 'ginkgoferry';

// 评论区：giscus.app 配置页生成这四个值；repo 留空则关闭评论。
// 前置：仓库 Settings 里开启 Discussions，并给仓库安装 giscus app。
export const GISCUS = {
  repo: 'ginkgoferry/ginkgoferry.github.io',
  repoId: 'R_kgDOT00teg',
  category: 'Announcements',
  categoryId: 'DIC_kwDOT00tes4DDMHg',
};
