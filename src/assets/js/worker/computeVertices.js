import earcut from "earcut"

self.onmessage = e => {
    console.log('e',e);
    const options = e.data
    console.log('options',options);
    
    // const reData = computeVetices(options);
    self.postMessage("")
}
function computeVetices(options) {

    let sequence = 0;

    const {features, context, lowPositionArray, highPositionArray, indexArray, uvs, normals, pickColors,pickIds } = options
    for (let index = 0; index < features.length; index++) {
        const element = features[index];
        const geometryPickId = context.createPickId({
            geometry: element.geometry,
            primitive: this,
            description: `实例id：${features[index].id}`,
            id: features[index].id
            // color: color,
        })
        const pickColor = geometryPickId.color;
        geometryPickId.pickId = geometryPickId;

        pickIds.push(geometryPickId)
        sequence = setData(element, lowPositionArray, highPositionArray, indexArray, uvs, normals, pickColors, pickColor, sequence)
        if (index == features.length - 1) {
          
             return { context, lowPositionArray, highPositionArray, indexArray, uvs, normals, pickColors,pickIds }
 
        }

    }
}
function setData(element, lowPositionArray, highPositionArray, indexArray, uvs, normals,pickColors,pickColor, sequence) {
    const coordinates = element.geometry.coordinates[0];
    const properties = element.properties;
    const points = []


    for (let index = 1; index < coordinates.length; index++) {
        const point = coordinates[index - 1];
        const nextPoint = coordinates[index];
        const pointBot = [...point, properties.elevation];
        const nextPointBot = [...nextPoint, properties.elevation]
        const nextPointTop = [...nextPoint, properties.elevation + properties.height];
        const pointTop = [...point, properties.elevation + properties.height];
        getCartesian3(pointBot, lowPositionArray, highPositionArray,pickColors,pickColor);
        getCartesian3(nextPointBot, lowPositionArray, highPositionArray,pickColors,pickColor);
        getCartesian3(nextPointTop, lowPositionArray, highPositionArray,pickColors,pickColor);
        getCartesian3(nextPointTop, lowPositionArray, highPositionArray,pickColors,pickColor);
        getCartesian3(pointTop, lowPositionArray, highPositionArray,pickColors,pickColor);
        getCartesian3(pointBot, lowPositionArray, highPositionArray,pickColors,pickColor);
        if (index == 1) {
            points.push(...pointTop);
        }
        points.push(...nextPointTop);

        indexArray.push(sequence, sequence + 1, sequence + 2, sequence + 3, sequence + 4, sequence + 5);
        uvs.push(0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0);
        setNormal([pointBot, nextPointBot, nextPointTop], normals);
        setNormal([nextPointTop, pointTop, pointBot], normals);



        sequence += 6
        if (index == coordinates.length - 1) {
            const triangles = earcut(points, null, 3)
            for (let j = 0; j < triangles.length;) {
                const point1 = points.slice(triangles[j] * 3, triangles[j] * 3 + 3);
                const point2 = points.slice(triangles[j + 1] * 3, triangles[j + 1] * 3 + 3);
                const point3 = points.slice(triangles[j + 2] * 3, triangles[j + 2] * 3 + 3);
                getCartesian3(point1, lowPositionArray, highPositionArray,pickColors,pickColor);
                getCartesian3(point2, lowPositionArray, highPositionArray,pickColors,pickColor);
                getCartesian3(point3, lowPositionArray, highPositionArray,pickColors,pickColor);
                setNormal([point1, point2, point3], normals)
                indexArray.push(sequence, sequence + 1, sequence + 2);
                sequence += 3
                j += 3;
            }
        }
    }
    return sequence;
}
function setNormal(points, normals) {
    const c_0 = new Cesium.Cartesian3.fromDegrees(...points[0]);
    const c_1 = new Cesium.Cartesian3.fromDegrees(...points[1]);
    const c_2 = new Cesium.Cartesian3.fromDegrees(...points[2]);
    const d1 = Cesium.Cartesian3.subtract(c_1, c_0, new Cesium.Cartesian3());
    const d2 = Cesium.Cartesian3.subtract(c_2, c_0, new Cesium.Cartesian3());
    let normal = Cesium.Cartesian3.cross(d1, d2, new Cesium.Cartesian3());
    normal = Cesium.Cartesian3.normalize(normal, new Cesium.Cartesian3());
    normals.push(
        normal.x,
        normal.y,
        normal.z,
        normal.x,
        normal.y,
        normal.z,
        normal.x,
        normal.y,
        normal.z
    );
}
function getCartesian3(points, lowArray, highArray,pickColors,pickColor) {
    const value = Cesium.Cartesian3.fromDegrees(...points);
    // const lonLat = ellipsoid.cartesianToCartographic(
    //     value,
    //     scratchProjectTo2DCartographic
    // );
    // const cartesian = projection.project(
    //     lonLat,
    //     scratchProjectTo2DCartesian3
    // );
    const newCartesian3 = Cesium.EncodedCartesian3.fromCartesian(value);
    lowArray.push(newCartesian3.low.x, newCartesian3.low.y, newCartesian3.low.z)
    highArray.push(newCartesian3.high.x, newCartesian3.high.y, newCartesian3.high.z)

    pickColors.push(pickColor.red,pickColor.green,pickColor.blue,pickColor.alpha)
}