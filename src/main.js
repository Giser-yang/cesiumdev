import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './style/index.scss'
// 引入elementPlus
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from "element-plus/dist/locale/zh-cn.mjs";
import mitt from "mitt";
const eventBus = mitt();


const VUE = createApp(App)
VUE.config.globalProperties.bus = eventBus; // 注册全局通信事件控制器
window.$bus = eventBus;
VUE.use(ElementPlus, {
	locale: zhCn
})
VUE.use(router)
VUE.use(store)
VUE.mount('#app')

router.beforeEach((to, from, next) => {
    /* 路由发生变化修改页面title */
    if (to.meta.title) {
        document.title = to.meta.title
    }
    next()
})