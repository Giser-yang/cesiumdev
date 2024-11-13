
const state = {
  // 四大城市初始视角
  citysView: {
    "lon": 116.2563446412619,
    "lat": 14.598563270467483,
    "height": 3703189.212197024,
    "heading": 344.6017669349914,
    "pitch": -66.55008146611499,
    "roll": 0.012579153393972933
  },
  trafficView: {
    "lon": 104.05088805328329,
    "lat": 30.577713056475485,
    "height": 11011.533704588906,
    "heading": 0,
    "pitch": -85.85092371312511,
    "roll": 0
  },
  plancView: {
    "lon": 104.06811901995059,
    "lat": 30.52624298579929,
    "height": 10000,
    "heading": 0,
    "pitch": -60,
    "roll": 0,
    duration: 1.5
  },
  cyxzView: {
    "lon": 104.02894770124718,
    "lat": 30.567082489176965,
    "height": 4054.5943006637863,
    "heading": 59.875329726956856,
    "pitch": -39.97014397081868,
    "roll": 0.003587525234978556,
    duration: 1.5
  },
  KGview: {
    "lon": 104.06316106675983,
    "lat": 30.586376220750147,
    "height": 10000,
    "heading": 0,
    "pitch": -90,
    "roll": 0,
    duration: 0.5
  }

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
