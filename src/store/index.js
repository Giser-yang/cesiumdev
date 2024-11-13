import { createStore } from 'vuex' //导入createStore构造函数
 
import camera from './modules/camera'
import map from './modules/map'
// import menu from './menu'
// import screen from './screen'
export default createStore({
  state: {
    
  },
  getters: {
    //提供获取Vux状态的方式, 注意在组件中调用时getPerson是以属性的方式被访问

  },
  mutations: {
    //提供直接操作Vuex的方法，注意mutations里的方法中不能有任何异步操做
   
  },
  actions: {
    //提供通过mutations方法来简介操作Vuex的方法

  },
  modules: {
    map,camera
    // camera,map,menu,screen
  }
})
