<template>
  <section id="cesiumContainer"></section>
</template>

<script setup>
import { reactive, toRefs, onBeforeMount, onMounted, watchEffect, watch } from "vue";

import { setView, flyTo } from "@/utils/setCamera";
import { CustomPolygonPrimitive } from "@/utils/drawPolygon";
import { CustomWallPrimitive } from "@/utils/drawWall";
import areaJson from "@/assets/json/polygon.json";

const data = reactive({});

const loadCesiumLabImage = (info) => {
  const imgLayer = new Cesium.ImageryLayer(
    new Cesium.UrlTemplateImageryProvider({
      url: info.url,
      rectangle: new Cesium.Rectangle.fromDegrees(
        info.rectangle[0] + info.tx,
        info.rectangle[1] + info.ty,
        info.rectangle[2] + info.tx,
        info.rectangle[3] + info.ty
      ),
      minimumLevel: info.minimumLevel,
      maximumLevel: info.maximumLevel,
      tx: info.tx,
      ty: info.ty,
    })
  );
  // 添加图层到viewer
  // const imageService = window.viewer.imageryLayers.add(imgLayer);
  return imgLayer;
};
const initMap = (divId) => {
  const viewer = new Cesium.Viewer(divId, {
    selectionIndicator: false,
    // 是否显示信息窗口
    infoBox: false,
    // 是否创建动画
    animation: false,
    // VRButton:true,
    shouldAnimate: true, // 自动播放
    // 是否显示图层选择器
    baseLayerPicker: false,
    // shadows: true,
    // 是否显示全屏按钮
    fullscreenButton: false,
    // 是否显示右上角的查询按钮
    geocoder: false,
    // 是否显示HOME按钮
    homeButton: false,
    // 是否显示场景控制按钮
    sceneModePicker: false,
    // 是否显示帮助按钮
    navigationHelpButton: false,
    // 是否显示时间轴
    timeline: false,
    // scene3DOnly: true,
    // 默认图层 全球9级谷歌影像
    baseLayer: new Cesium.ImageryLayer(
      new Cesium.UrlTemplateImageryProvider({
        url:
          "http://192.168.200.237:88/gis_tiles2/QuanQiu/Image/09/Image_Tiles/{z}/{x}/{y}.png",
        maximumLevel: 9, // 加载的最大级别
      })
    ),
    // 默认地形 全球90米地形
    terrain: new Cesium.Terrain(
      Cesium.CesiumTerrainProvider.fromUrl(
        "http://192.168.200.237:88/gis_tiles2/QuanQiu/Terrain/90m/"
      )
    ),
  });
  // viewer.scene.fxaa = false;
  viewer.scene.postProcessStages.fxaa.enabled = true;

  viewer.scene.debugShowFramesPerSecond = true; // 显示帧速 FPS
  // viewer.imageryLayers.add(new Cesium.ImageryLayer(new window.Cesium.AMapImageryProvider({ style: 'img', crs: 'WGS84' })));
  // 设置光照时间
  const utc = Cesium.JulianDate.fromDate(new Date(new Date("2024/07/04 16:00:00")));
  viewer.cesiumWidget.creditContainer.style.display = "none"; // 去除cesium图标
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.clockViewModel.currentTime = Cesium.JulianDate.addHours(
    utc,
    0,
    new Cesium.JulianDate()
  );
  const CesiumViewerSceneController = viewer.scene.screenSpaceCameraController;
  // 最小缩放高度（米）
  // CesiumViewerSceneController.minimumZoomDistance = 100;
  // 最大缩放高度（米）
  // CesiumViewerSceneController.maximumZoomDistance = 3000;

  CesiumViewerSceneController.inertiaSpin = 0;
  CesiumViewerSceneController.inertiaTranslate = 0;
  CesiumViewerSceneController.inertiaZoom = 0;
  fetch(
    "http://10.20.170.17:30129/saas-house-map/gis/info/getImageService?areaCode=510100&type=base",
    {
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log("data", data);
      data.data.forEach((element) => {
        // cesiumLab影像数据
        const cesiumLabImageServerInfo = {
          url: element.url,
          rectangle: element.rectangle.split(","),
          minimumLevel: element.minLevel,
          maximumLevel: element.maxLevel,
          tx: 0.0,
          ty: 0.0,
        };
        // if (window.tenMeterImageLayer) {
        //   window.viewer.imageryLayers.remove(window.tenMeterImageLayer);
        // }
        const tenMeterImageLayer = loadCesiumLabImage(cesiumLabImageServerInfo);
        viewer.imageryLayers.add(tenMeterImageLayer, 1);
      });
    });
  return viewer;
};

onBeforeMount(() => {});
onMounted(() => {
  const viewer = initMap("cesiumContainer");
  window.viewer = viewer;
  window.frameCount =0;
  viewer.scene.preUpdate.addEventListener(function(){
    window.frameCount++;
  })
  const options = {
    lon: 104.05088805328329,
    lat: 30.577713056475485,
    height: 11011.533704588906,
    heading: 0,
    pitch: -85.85092371312511,
    roll: 0,
  };
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(options.lon, options.lat, options.height),
    orientation: {
      heading: Cesium.Math.toRadians(options.heading),
      pitch: Cesium.Math.toRadians(options.pitch),
      roll: Cesium.Math.toRadians(options.roll),
    },
    duration: options.duration ? options.duration : 3.0,
  });
  const primitive = new CustomWallPrimitive({
    coordinates: areaJson.features[0].geometry.coordinates[0],
    altitude:550,
    height:50
  });
  viewer.scene.primitives.add(primitive);
 
  
});

watchEffect(() => {});
defineExpose({
  ...toRefs(data),
});
</script>
<style scoped lang="scss">
#cesiumContainer {
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
}
</style>
