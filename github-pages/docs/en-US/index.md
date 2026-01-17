---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'vue-fn'
  tagline: 'Vue 3 Reactive Function Utility Library'
  actions:
    - theme: brand
      text: Get Started
      link: /en-US/guide/index
    - theme: alt
      text: GitHub
      link: https://github.com/AlphaFoxz/vue-fn

features:
  - title: Domain-Driven Design
    details: Functional implementation of DDD patterns with events, aggregations, and plugins
  - title: Modular Architecture
    details: Multiple independently consumable modules (domain, domain-server, shared-domain, timer) with Tree Shaking support
  - title: Vue 3 Reactivity
    details: Built on @vue/reactivity for optimal reactive state management
  - title: Type Safety
    details: Full TypeScript support with excellent developer experience
  - title: Client/Server
    details: domain module for client apps, domain-server optimized for Node.js environments
  - title: Cross-Tab State
    details: shared-domain module provides cross-tab/window state sharing via BroadcastChannel API
  - title: Binding Utilities
    details: bindRef and bindReactive tools for two-way data binding
---
