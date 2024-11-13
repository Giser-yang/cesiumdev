<template>
  <section class="page-control">
    <div class="project-logo"></div>
    <div class="left-control">
      <img src="../assets/images/topControl/companylogo.png" alt="" />
      <img id="compass" src="../assets/images/topControl/compass.png" alt="" />
      <div class="time-text">
        <span>{{ `${data.hours}:${data.minutes}` }}</span>
      </div>
    </div>
    <div class="right-control">
      <img :src="data.citys ? citysActive : citys" alt="" @click="clickCitys" />
      <img :src="data.traffic ? trafficActive : traffic" alt="" @click="clickTraffic" />
      <img :src="data.plan ? planActive : plan" alt="" @click="clickPlan" />
      <img :src="data.general ? generalActive : general" alt="" @click="clickGeneral" />
      <img  src="../assets/images/topControl/split.png" alt="" />
      <!-- <img
      v-if="false"
        :src="data.firstPerson ? lookFirstActive : lookFirst"
        alt=""
        @click="clickLookAt"
      /> -->
    </div>
  </section>
</template>

<script setup>
import {
  reactive,
  toRefs,
  onBeforeMount,
  onMounted,
  watchEffect,
  defineEmits,
} from "vue";
import citys from "../assets/images/topControl/city.png";
import citysActive from "../assets/images/topControl/city-active.png";
import traffic from "../assets/images/topControl/traffic.png";
import trafficActive from "../assets/images/topControl/traffic-active.png";
import plan from "@/assets/images/topControl/lookat.png";
import planActive from "@/assets/images/topControl/lookat-active.png";
import general from "@/assets/images/topControl/gxgk.png"
import generalActive from "@/assets/images/topControl/gxgk-active.png"
import { useStore } from "vuex";
const data = reactive({
  hours: "",
  minutes: "",
  citys: true,
  traffic: false,
  plan:false,
  general:false,
  // firstPerson: false,
});
const appStore = useStore();
const emit = defineEmits();
const clickCitys = () => {
  data.citys = true;
  data.plan = false;
  data.general = false;
  data.traffic = false;
  emit("clickCitys");
};
const clickTraffic = () => {
  data.citys = false;
  data.plan = false;
  data.general = false;
  data.traffic = true;
  emit("clickTraffic");
};
const clickPlan = ()=>{
  data.citys = false;
  data.traffic = false;
  data.general = false;
  data.plan = true;
  emit("clickPlan");
}
const clickGeneral = ()=>{
  data.citys = false;
  data.traffic = false;
  data.plan = false;
  data.general = true;
  emit("clickGeneral");
  
}
const rightEvent = (click) => {
    let position = window.viewer.scene.pickPosition(click.position);
      console.log("position", position);

      // const position = window.viewer.scene.globe.pick(ray, window.viewer.scene);
    //   const cartographicPosition = Cesium.Cartographic.fromCartesian(position);

    //   const lon = Cesium.Math.toDegrees(cartographicPosition.longitude);
    //   const lat = Cesium.Math.toDegrees(cartographicPosition.latitude);
    //   const height = cartographicPosition.height;
    //   const center = Cesium.Cartesian3.fromDegrees(lon, lat, height);
      window.viewer.camera.lookAt(position, new Cesium.HeadingPitchRange(window.viewer.camera.heading, window.viewer.camera.pitch, 1))
    //   console.log("获取到的坐标：", lon, lat, height);
};
const clickLookAt = () => {
  console.log("第一人称");
  data.firstPerson = !data.firstPerson;
  if (data.firstPerson) {
    // 最小缩放高度（米）
    window.viewer.scene.screenSpaceCameraController.minimumZoomDistance =0;
    window.viewer.screenSpaceEventHandler.setInputAction(function (click) {
        rightEvent(click);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }else{
    window.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
     // 最小缩放高度（米）
     window.viewer.scene.screenSpaceCameraController.minimumZoomDistance =
    appStore.state.map.minimumZoomDistance;
    window.viewer.screenSpaceEventHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.RIGHT_CLICK
      ); //移除右键鼠标点击事件
  }
};
const updateTime = () => {
  const today = new Date();
  // data.year = today.getFullYear();
  // data.month = today.getMonth() + 1; // 注意月份从0开始，所以要加1
  // data.date = today.getDate();

  data.hours = today.getHours();
  if (data.hours < 10) {
    data.hours = "0" + data.hours;
  }
  data.minutes = today.getMinutes();
  if (data.minutes < 10) {
    data.minutes = "0" + data.minutes;
  }
  // data.seconds = today.getSeconds();
  // if (data.seconds < 10) {
  //   data.seconds = "0" + data.seconds;
  // }
};
onBeforeMount(() => {});
onMounted(() => {
  // 更新时间 1s
  updateTime();
  setInterval(() => {
    updateTime();
  }, 1000);
  // 指北针监听事件
  const compass = document.getElementById("compass");
  window.viewer.scene.preRender.addEventListener(() => {
    compass.style.transform = `rotateZ(${Cesium.Math.toDegrees(
      window.viewer.camera.heading
    )}deg)`;
  });
});
watchEffect(() => {});
defineExpose({
  ...toRefs(data),
});
</script>
<style scoped lang="scss">
.page-control {
  position: absolute;
  z-index: 30;
  left: 0;
  top: 0;
  width: 100%;
  height: 1rem;
  background-image: url("../assets/images/topControl/bg.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .project-logo {
    position: absolute;
    width: 10rem;
    height: 0.7rem;
    top: 0.15rem;
    left: 50%;
    transform: translateX(-50%);
    background-image: url("../assets/images/topControl/LOGO.png");
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }
  .left-control {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: start;
    align-items: center;
    width: 30%;
    height: 100%;
    padding-left: 0.1rem;
    img {
      position: relative;
      height: 80%;
      margin: 0 0.2rem;
    }
    .time-text {
      margin: 0 0.1rem;
      color: white;
      font-size: 0.5rem;
    }
  }
  .right-control {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: end;
    align-items: center;
    width: 30%;
    height: 100%;
    padding-right: 0.1rem;
    img {
      position: relative;
      height: 100%;
      margin: 0 0.1rem;
      cursor: pointer;
    }
  }
}
</style>
