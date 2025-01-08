import { createRouter, createWebHashHistory } from 'vue-router'
 
const routes = [
  {
    path: '/',
    redirect: '/scene'
  },
  {
    path: '/scene',
    name: 'scene',
    meta: {
      title: '功能测试',
    },
    component: () => import('../views/homeMap/homeScene.vue')
  },
  {
    path: '/webworker',
    name: 'webworker',
    meta: {
      title: '异步加载',
    },
    component: () => import('../views/examples/webworker.vue')
  },
  {
    path: '/postprocess',
    name: 'postprocess',
    meta: {
      title: '后处理',
    },
    component: () => import('../views/examples/potProcess.vue')
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
router.beforeEach(() => {})

export default router
