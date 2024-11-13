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
  
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
router.beforeEach(() => {})

export default router
