import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Miracle Docs",
  description: "A lovely VitePress theme QwQ",
  base: '/mrcd/',
  lastUpdated: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
    ],

    sidebar: [
      {
        text: '入门',
        items: [
          { text: '安装', link: '/config-guide/1' },
          { text: '基础配置', link: '/config-guide/2' }
        ]
      },
      {
        text: '进阶',
        items: [
          { text: '友情链接', link: '/config-plus/1' },
          { text: '留言', link: '/config-plus/2' },
          { text: '歌单', link: '/config-plus/3' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Miralous/Miracle' }
    ],
  }
})
