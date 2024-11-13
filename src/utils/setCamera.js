const setView = (options,complete) => {
    if(!options) return;
    window.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(options.lon, options.lat, options.height),
        orientation: {
            heading: Cesium.Math.toRadians(options.heading),
            pitch: Cesium.Math.toRadians(options.pitch),
            roll: Cesium.Math.toRadians(options.roll),
        },
    })
}
const flyTo = (options,complete) => {
    window.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(options.lon, options.lat, options.height),
        orientation: {
            heading: Cesium.Math.toRadians(options.heading),
            pitch: Cesium.Math.toRadians(options.pitch),
            roll: Cesium.Math.toRadians(options.roll),
        },
        duration:options.duration?options.duration:3.0,

        complete:complete?complete:function(){}
    })
}
export { setView,flyTo }