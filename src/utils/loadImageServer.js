const loadCesiumLabImage = (info) => {
    const imgLayer = new Cesium.ImageryLayer(
      new Cesium.UrlTemplateImageryProvider({
        url: info.url,
        rectangle: new Cesium.Rectangle.fromDegrees(
          info.rectangle[0],
          info.rectangle[1],
          info.rectangle[2],
          info.rectangle[3]
        ),
        minimumLevel: info.minimumLevel,
        maximumLevel: info.maximumLevel,
      })
    );
    return imgLayer;
  };
export {loadCesiumLabImage}