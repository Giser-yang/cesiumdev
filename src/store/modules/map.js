
const state = {
  // 地图相机最小高度
  minimumZoomDistance: 0,
  // 地图相机最大高度
  maximumZoomDistance: 5000000,
  // // 地图范围
  // area: { minLon: 102.915913, minLat: 29.230197, maxLon: 105.265694, maxLat: 31.568735},
  // 项目中心点
  projectCenter: [104.06091361497967, 30.585612836729748, 515],
  modelTilesShowHeight: 8000,
};
const getters = {
  //提供获取Vux状态的方式, 注意在组件中调用时getPerson是以属性的方式被访问
};
const mutations = {

}
const actions = {
  //提供通过mutations方法来简介操作Vuex的方法
}
export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
