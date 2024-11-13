 // 设置3dtiles偏移
 const translateTileSet = (translate) => {
    const cartographic = Cesium.Cartographic.fromCartesian(
      translate.tileSet.boundingSphere.center
    );
    const surface = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height
    );
    const m = Cesium.Transforms.eastNorthUpToFixedFrame(surface);
    const _tx = translate.tx ? translate.tx : 0;
    const _ty = translate.ty ? translate.ty : 0;
    const _tz = translate.tz ? translate.tz : 0;
    const tempTranslation = new Cesium.Cartesian3(_tx, _ty, _tz);
    const offset = Cesium.Matrix4.multiplyByPoint(
      m,
      tempTranslation,
      new Cesium.Cartesian3(0, 0, 0)
    );
    const translation = Cesium.Cartesian3.subtract(
      offset,
      surface,
      new Cesium.Cartesian3()
    );
    let modelMatrix = Cesium.Matrix4.fromTranslation(translation);
    translate.tileSet.modelMatrix = modelMatrix;
    return modelMatrix;
  };

  // 加载3dtiles模型
  const addTiles = async (tileData, show) => {
    try {
      const tileset = window.tilesetCollection.add(
        await Cesium.Cesium3DTileset.fromUrl(tileData.url, {
          show: show, // 是否展示
          // shadows:ShadowMode.ENABLED,   // 阴影
          cacheBytes: 536870912, // 如果缓存包含当前视图不需要的块，则块缓存将被裁剪到的大小(以字节为单位)。 1024M
          maximumCacheOverflowBytes: 536870912, // 如果当前视图需要超过Cesium3DTileset#cacheBytes，则允许缓存净空的最大额外内存(以字节为单位)。
          maximumScreenSpaceError: 1, // 数值加大，能让最终成像变模糊   最大屏幕空间错误
          cullWithChildrenBounds: true, // 是否使用子边界体积的并集来剔除tiles
          cullRequestsWhileMoving: true, // 不要求因为相机移动而返回时可能未使用的tiles
          cullRequestsWhileMovingMultiplier: 80.0, // 值越小能够更快的剔除  移动时用于剔除请求 较大的是更积极的剔除，较小的是较不积极的剔除。
          preloadWhenHidden: true, // tiles重置时预加载tiles
          preloadFlightDestinations: true, // 相机移动时，在相机的移动目的地预加载  为true，飞行过程请求数据加载会掉帧卡顿
          preferLeaves: false, // 优先加载子节点
          dynamicScreenSpaceError: false, //  在真正的全屏加载完之后才清晰化房屋  false
          dynamicScreenSpaceErrorDensity: 2.0e-4, // 数值加大，能让周边加载变快   调整动态屏幕空间误差，类似于雾密度 0.00278  0.5
          dynamicScreenSpaceErrorFactor: 24.0, // 增加计算的动态屏幕空间误差的系数
          dynamicScreenSpaceErrorHeightFalloff: 0.25, // 视角下降时tiles密集的比例
          progressiveResolutionHeightFraction: 0.3, // 数值偏于0能够让初始加载变得模糊 加载全分辨率平铺的同时快速向下铺一层平铺
          foveatedScreenSpaceError: true, // 通过临时提供屏幕边缘周围平铺的屏幕空间错误，优先加载屏幕中心的平铺
          foveatedConeSize: 0.1, // 控制确定哪些分片被延迟的圆锥体大学，圆锥体内的tiles立即加载，圆锥体外的平铺可能会根据其在圆锥体之外的距离及其屏幕空间错误而延迟。
          foveatedMinimumScreenSpaceErrorRelaxation: 0.0, //
          foveatedTimeDelay: 0.1, // 控制相机停止移动后等待的时间（以秒为单位），延迟的tiles开始加载。
          skipLevelOfDetail: true, // 确定在遍历期间是否应应用详细级别跳过。
          baseScreenSpaceError: 512, // 跳过详细级别前必须达到的屏幕空间错误
          skipScreenSpaceErrorFactor: 16,
          skipLevels: 1,
          immediatelyLoadDesiredLevelOfDetail: false, // 当skipLevelOfDetail为true时，只下载满足最大屏幕空间错误的tiles，忽略跳过因子，只加载所需的分片
          loadSiblings: false, // 如果为true则不会在已加载完概况房屋后，自动从中心开始超清化房屋  当skipLevelOfDetail为true时，确定在遍历期间是否始终下载可见分片的同级
          enableShowOutline: false, // 是否使用CESIUM_primitive_outline扩展为模型启用大纲。可以将此设置为false以避免在加载时对几何图形进行额外处理。当为false时，showOutlines和outlineColor选项将被忽略。
          // enableCollision: true, // 当 时true，启用相机或 CPU 拾取的碰撞。
        })
      );

      // 调整模型位置
      const translateParma = {
        tx: tileData.x,
        ty: tileData.y,
        tz: tileData.z,
        tileSet: tileset,
      };
      translateTileSet(translateParma);
      return tileset;
    } catch (error) {
      console.error("error", error,tileData.url);
    }
  };

export {addTiles}