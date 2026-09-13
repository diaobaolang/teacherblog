<template>
  <!-- 灰色粒子浮动背景：固定铺满视口，绘制在所有页面内容之下 -->
  <div id="particle-bg" class="particle-bg"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
// particles.js 是纯浏览器全局脚本（无 ESM/CJS 导出），且内部用了 arguments.callee。
// 若直接 `import 'particles.js'`，Vite 会把它当作 ES Module 执行——ESM 天生是严格模式，
// arguments.callee 会抛 TypeError，导致粒子实例初始化失败，画布一片空白。
// 因此这里用 ?raw 取源码，再以经典 <script> 注入，让它在非严格模式下运行。
import particlesSource from 'particles.js/particles.js?raw'

const CONTAINER_ID = 'particle-bg'

// 深灰色调、漂浮略快，保证在浅色页面上运动轨迹清晰可见
const config = {
  particles: {
    number: {
      value: 80,
      density: { enable: true, value_area: 1000 }
    },
    color: { value: '#59626f' },
    shape: { type: 'circle' },
    opacity: {
      value: 0.85,
      random: true,
      anim: { enable: false }
    },
    size: {
      value: 3.6,
      random: true,
      anim: { enable: false }
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: '#7d8896',
      opacity: 0.7,
      width: 1
    },
    move: {
      enable: true,
      speed: 1.7,
      direction: 'none',
      random: true,
      straight: false,
      out_mode: 'out',
      bounce: false
    }
  },
  // 背景层不接收鼠标事件（避免挡住页面点击），因此不开启悬停 / 点击交互
  interactivity: {
    detect_on: 'canvas',
    events: {
      onhover: { enable: false },
      onclick: { enable: false },
      resize: true
    }
  },
  retina_detect: true
}

// 只注入一次，多个页面切换时复用同一个全局 particlesJS
let injectPromise = null

function injectParticlesScript() {
  if (typeof window.particlesJS === 'function') return Promise.resolve()
  if (!injectPromise) {
    injectPromise = new Promise((resolve) => {
      const script = document.createElement('script')
      script.textContent = particlesSource
      document.head.appendChild(script)
      resolve()
    })
  }
  return injectPromise
}

function destroyParticles() {
  const instances = Array.isArray(window.pJSDom) ? window.pJSDom.slice() : []
  instances.forEach((item) => {
    try {
      item?.pJS?.fn?.vendors?.destroypJS?.()
    } catch (e) {
      /* 个别实例销毁失败时忽略 */
    }
  })
  window.pJSDom = []
  // 兜底：清掉残留的 canvas，避免路由来回切换后叠加出多层粒子
  const el = document.getElementById(CONTAINER_ID)
  if (el) el.innerHTML = ''
}

onMounted(async () => {
  destroyParticles()
  await injectParticlesScript()
  if (typeof window.particlesJS !== 'function') {
    console.warn('[ParticleBackground] particles.js 注入失败，粒子背景不可用')
    return
  }
  // 异步等待期间组件可能已卸载，容器不在了就跳过绘制
  if (!document.getElementById(CONTAINER_ID)) return
  window.particlesJS(CONTAINER_ID, config)
})

onBeforeUnmount(destroyParticles)
</script>

<style scoped>
.particle-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 负值：绘制在页面内容之下、body 背景色之上 */
  z-index: -1;
  /* 不遮挡页面上的点击、滚动与文字选择 */
  pointer-events: none;
}
</style>
