import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'vue-fn',
  description: 'A Vue 3 reactive function utility library providing domain-driven design patterns and reactive state management utilities',
  base: '/vue-fn/',

  // Configure multiple locales - VitePress will detect browser language
  // and redirect users to the appropriate language version
  locales: {
    'en-US': {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en-US/' },
          { text: 'Guide', link: '/en-US/guide/index' },
          { text: 'GitHub', link: 'https://github.com/AlphaFoxz/vue-fn' },
        ],
        sidebar: {
          '/en-US/guide/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Introduction', link: '/en-US/guide/index' },
              ],
            },
            {
              text: 'Module Documentation',
              items: [
                { text: 'domain', link: '/en-US/guide/domain' },
                { text: 'domain-server', link: '/en-US/guide/domain-server' },
                { text: 'shared-domain', link: '/en-US/guide/shared-domain' },
                { text: 'timer', link: '/en-US/guide/timer' },
              ],
            },
          ],
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/AlphaFoxz/vue-fn' },
        ],
      },
    },
    'zh-CN': {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '主页', link: '/zh-CN/' },
          { text: '文档', link: '/zh-CN/guide/index' },
          { text: 'GitHub', link: 'https://github.com/AlphaFoxz/vue-fn' },
        ],
        sidebar: {
          '/zh-CN/guide/': [
            {
              text: '开始',
              items: [
                { text: '简介', link: '/zh-CN/guide/index' },
              ],
            },
            {
              text: '模块文档',
              items: [
                { text: 'domain', link: '/zh-CN/guide/domain' },
                { text: 'domain-server', link: '/zh-CN/guide/domain-server' },
                { text: 'shared-domain', link: '/zh-CN/guide/shared-domain' },
                { text: 'timer', link: '/zh-CN/guide/timer' },
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
