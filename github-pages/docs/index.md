---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'vue-fn'
  tagline: 'Vue 3 响应式函数工具库'
  actions:
    - theme: brand
      text: 快速开始
      link: /zh-CN/content/index
    - theme: alt
      text: GitHub
      link: https://github.com/AlphaFoxz/vue-fn

features:
  - title: 领域驱动设计
    details: 提供 DDD（领域驱动设计）模式的函数式实现，包含事件、聚合、插件等核心概念
  - title: 模块化设计
    details: 多个独立可消费的模块（domain、domain-server、shared-domain、timer），支持按需加载和 Tree Shaking 优化
  - title: Vue 3 响应式
    details: 基于 @vue/reactivity 构建，充分利用 Vue 3 的响应式系统
  - title: 类型安全
    details: 完整的 TypeScript 类型支持，提供优秀的开发体验
  - title: 客户端/服务端
    details: domain 模块支持客户端应用，domain-server 模块专为 Node.js 环境优化
  - title: 跨标签页状态
    details: shared-domain 模块提供基于 BroadcastChannel API 的跨标签页/窗口状态共享
  - title: 绑定工具
    details: 提供 bindRef 和 bindReactive 工具，实现双向数据绑定
---
