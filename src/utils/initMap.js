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
        // 默认地形
        terrain: new Cesium.Terrain(
            Cesium.CesiumTerrainProvider.fromUrl(
                "http://182.139.35.142:8085/Terrain/5m/Sichuan/tiles_cd/"
            )
        ),
    });
    // viewer.scene.fxaa = false;
    viewer.scene.postProcessStages.fxaa.enabled = true;

    viewer.scene.debugShowFramesPerSecond = true; // 显示帧速 FPS
    // viewer.imageryLayers.add(new Cesium.ImageryLayer(new window.Cesium.AMapImageryProvider({ style: 'img', crs: 'WGS84' })));
    // 设置光照时间
    const utc = Cesium.JulianDate.fromDate(new Date(new Date("2024/07/04 16:00:00")));
    viewer.scene.globe.enableLighting = true;
    //  viewer.shadows = true;
    //   viewer.terrainShadows = Cesium.ShadowMode.RECEIVE_ONLY;
    //  viewer.shadowMap.darkness = 0.5; //阴影透明度--越大越透明
    //   viewer.shadowMap.size = 4096;
    //  viewer.shadowMap.maximumDistance = 4000;
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


    // cesiumLab影像数据
    const cesiumLabImageServerInfo = {
        url: "http://182.139.35.142:8084/cd_tiles/{z}/{x}/{y}.png",
        rectangle: "103.770088,30.318900,104.382188,30.897295".split(","),
        minimumLevel: 0,
        maximumLevel: 18,
        tx: 0.0,
        ty: 0.0,
    };
    const tenMeterImageLayer = loadCesiumLabImage(cesiumLabImageServerInfo);
    viewer.imageryLayers.add(tenMeterImageLayer, 1);

    return viewer;
};

export { initMap }