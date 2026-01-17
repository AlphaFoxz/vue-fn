import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'vue-fn',
  description: 'A Vue 3 reactive function utility library providing domain-driven design patterns and reactive state management utilities',
  base: '/vue-fn/',
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '主页', link: '/zh-CN/' },
          { text: '文档', link: '/zh-CN/content/index' },
          { text: 'GitHub', link: 'https://github.com/AlphaFoxz/vue-fn' },
        ],
        sidebar: {
          '/zh-CN/content/': [
            {
              text: '开始',
              items: [
                { text: '简介', link: '/zh-CN/content/index' },
              ],
            },
            {
              text: '模块文档',
              items: [
                { text: 'domain', link: '/zh-CN/content/domain' },
                { text: 'domain-server', link: '/zh-CN/content/domain-server' },
                { text: 'shared-domain', link: '/zh-CN/content/shared-domain' },
                { text: 'timer', link: '/zh-CN/content/timer' },
              ],
            },
          ],
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/AlphaFoxz/vue-fn' },
        ],
      },
    },
  },
});
