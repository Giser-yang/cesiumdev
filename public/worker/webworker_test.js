import earcut from "./earcut"
import Cartesian3 from "./cartesian/Cartesian3"
import EncodedCartesian3 from "./cartesian/EncodedCartesian3"
self.onmessage = function (e) {
  let sequence = 0;
  const lowPositionArray = [];
  const highPositionArray = [];
  const indexArray = [];
  const uvs = [];
  const normals = [];
  const pickColors = [];
  
  // const { features, lowPositionArray, highPositionArray, indexArray, uvs, normals, pickColors, tempColors } = e.data;
  const receiveObject = e.data;
 
  for (let index = 0; index < receiveObject.features.length; index++) {
    const element = receiveObject.features[index];
    sequence = setData(element, lowPositionArray, highPositionArray, indexArray, uvs, normals, pickColors, receiveObject.tempColors[index], sequence)
  }
 
  const result = {
    lowPositionArray:lowPositionArray,
    highPositionArray:highPositionArray,

    stTypedArray:new Float32Array(uvs),
    normalTypedArray:new Float32Array(normals),
    colorTypedArray:new Float32Array(pickColors),
    indexTypedArray:new Uint32Array(indexArray)
  }

  self.postMessage(
    result
  )
  // 结束worker
  self.close();
}
function setData(element, lowPositionArray, highPositionArray, indexArray, uvs, normals, pickColors, pickColor, sequence) {
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
    getCartesian3(pointBot, lowPositionArray, highPositionArray, pickColors, pickColor);
    getCartesian3(nextPointBot, lowPositionArray, highPositionArray, pickColors, pickColor);
    getCartesian3(nextPointTop, lowPositionArray, highPositionArray, pickColors, pickColor);
    getCartesian3(nextPointTop, lowPositionArray, highPositionArray, pickColors, pickColor);
    getCartesian3(pointTop, lowPositionArray, highPositionArray, pickColors, pickColor);
    getCartesian3(pointBot, lowPositionArray, highPositionArray, pickColors, pickColor);
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
        getCartesian3(point1, lowPositionArray, highPositionArray, pickColors, pickColor);
        getCartesian3(point2, lowPositionArray, highPositionArray, pickColors, pickColor);
        getCartesian3(point3, lowPositionArray, highPositionArray, pickColors, pickColor);
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
  const c_0 = new Cartesian3.fromDegrees(...points[0]);
  const c_1 = new Cartesian3.fromDegrees(...points[1]);
  const c_2 = new Cartesian3.fromDegrees(...points[2]);
  const d1 = Cartesian3.subtract(c_1, c_0, new Cartesian3());
  const d2 = Cartesian3.subtract(c_2, c_0, new Cartesian3());
  let normal = Cartesian3.cross(d1, d2, new Cartesian3());
  normal = Cartesian3.normalize(normal, new Cartesian3());
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
function getCartesian3(points, lowArray, highArray, pickColors, pickColor) {
  const value = Cartesian3.fromDegrees(...points);
  // const lonLat = ellipsoid.cartesianToCartographic(
  //     value,
  //     scratchProjectTo2DCartographic
  // );
  // const cartesian = projection.project(
  //     lonLat,
  //     scratchProjectTo2DCartesian3
  // );
  const newCartesian3 = EncodedCartesian3.fromCartesian(value);
  lowArray.push(newCartesian3.low.x, newCartesian3.low.y, newCartesian3.low.z)
  highArray.push(newCartesian3.high.x, newCartesian3.high.y, newCartesian3.high.z)

  pickColors.push(pickColor.red, pickColor.green, pickColor.blue, pickColor.alpha)
}
