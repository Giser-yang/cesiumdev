<template>
  <div id="postProcess" class="full-size"></div>
</template>

<script setup>
import { reactive, toRefs, onBeforeMount, onMounted, watchEffect } from "vue";
import { initMap } from "@/utils/initMap";
import { addTiles } from "@/utils/load3Dtiles";
const data = reactive({});
onBeforeMount(() => {});
onMounted(async () => {
  const viewer = initMap("postProcess");
  window.viewer = viewer;
  const urls = [
    "http://182.139.35.142:8084/Cesium_DK/48_x411_y3367/Scene/Production_Cesium.json",
    "http://182.139.35.142:8084/Cesium_DK/48_x411_y3368/Scene/Production_Cesium.json",
  ];
  urls.forEach((url) => {
    const tileParam = {
      url: url,
      x: 0,
      y: 0,
      z: 2,
    };

    addTiles(tileParam, true);
  });

  //   // 抗锯齿
  //   viewer.scene.postProcessStages.fxaa.enabled = true;
  //   // 泛光
  //   viewer.scene.postProcessStages.bloom.enabled = true;
  // 环境光遮蔽 AO
  // viewer.scene.postProcessStages.ambientOcclusion.enabled  = true;
  // 整个场景 包括天空
  // const fs =`
  // uniform sampler2D colorTexture;
  // uniform sampler2D depthTexture;
  // in vec2 v_textureCoordinates;
  // uniform float scale;
  // uniform vec3 offset;
  // void main() {
  //     vec4 color = texture(colorTexture, v_textureCoordinates);
  //     // out_FragColor = vec4(color.rgb * scale + offset, 1.0);
  //     out_FragColor = color;
  //     float depth = czm_unpackDepth(texture(depthTexture,v_textureCoordinates));
  //     vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy,depth);
  //     vec3 eyeCoordinate3 = eyeCoordinate4.xyz/eyeCoordinate4.w;
  //     vec4 worldCoordinate4  = czm_inverseView*vec4(eyeCoordinate3,1);
  //     vec3 worldCoordinate = worldCoordinate4.xyz/worldCoordinate4.w;
  //     if(worldCoordinate.z<0.0){
  //         out_FragColor.r=1.0;
  //     }else{
  //         out_FragColor.g = 1.0;
  //     }
  // }
  // `;

  // // 只处理地球上内容
  // const fs = `
  //     uniform sampler2D colorTexture;
  //     uniform sampler2D depthTexture;
  //     in vec2 v_textureCoordinates;
  //     void main(void){
  //         out_FragColor = texture(colorTexture,v_textureCoordinates);
  //         float depth = czm_unpackDepth(texture(depthTexture,v_textureCoordinates));
  //         if(depth<1.0){
  //              out_FragColor .r = 1.0;
  //         }

  //     }
  // `

  // 只处理指定范围内  指定圆心 半径
  //   const fs = `
  //         uniform sampler2D colorTexture;
  //         uniform sampler2D depthTexture;
  //         in vec2 v_textureCoordinates;
  //         uniform vec3 center;
  //         uniform float radius;
  //         void main(){
  //             out_FragColor = texture(colorTexture,v_textureCoordinates);
  //             float depth = czm_unpackDepth(texture(depthTexture,v_textureCoordinates));
  //             vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy,depth);
  //             vec3 eyeCoordinate3 = eyeCoordinate4.xyz/eyeCoordinate4.w;
  //             vec4 worldCoordinate4 = czm_inverseView*vec4(eyeCoordinate3,1.0);
  //             vec3 worldCoordinate = worldCoordinate4.xyz/worldCoordinate4.w;
  //             if(distance(center,worldCoordinate)<radius){
  //                 out_FragColor.r = 1.0;
  //             }
  //         }
  //     `;
  //   let position = Cesium.Cartesian3.fromDegrees(
  //     104.09670819560192,
  //     30.420883277389514,
  //     600
  //   );
  //   viewer.scene.postProcessStages.add(
  //     new Cesium.PostProcessStage({
  //       fragmentShader: fs,
  //       uniforms: {
  //         center: position,
  //         radius: 10000,
  //       },
  //     })
  //   );

  //  处理指定矩形范围
  //   let positions = [[104.1, 30.4],[104.2, 30.4],[104.2, 30.5],[104.1,30.5]];
  //   positions = Cesium.Cartesian3.fromDegreesArray(positions.flat(2));
  //     console.log('positions',positions);

  //   // 建立局部坐标系 将所有点转到该坐标系下
  //   let m = Cesium.Transforms.eastNorthUpToFixedFrame(positions[0]);
  //   let inverse = Cesium.Matrix4.inverse(m,new Cesium.Matrix4());
  //   let localPositions = [];
  //   positions.forEach(position=>{
  //     localPositions.push(Cesium.Matrix4.multiplyByPoint(inverse,position,new Cesium.Cartesian3()));
  //   })
  //   let rect = Cesium.BoundingRectangle.fromPoints(localPositions,Cesium.BoundingRectangle);
  //   rect = new Cesium.Cartesian4(rect.x,rect.y,rect.x+rect.width,rect.y+rect.height);
  //   const fs = `
  //     uniform sampler2D colorTexture;
  //     uniform sampler2D depthTexture;
  //     in vec2 v_textureCoordinates;
  //     uniform vec4 rect;
  //     uniform mat4 inverse;
  //     void main(){
  //         out_FragColor = texture(colorTexture,v_textureCoordinates);
  //         float depth = czm_unpackDepth(texture(depthTexture,v_textureCoordinates));
  //         if(depth<1.0){
  //             vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy,depth);
  //             vec3 eyeCoordinate3 = eyeCoordinate4.xyz/eyeCoordinate4.w;
  //             vec4 worldCoordinate4 = czm_inverseView * vec4(eyeCoordinate3,1);
  //             vec3 worldCoordinate = worldCoordinate4.xyz/worldCoordinate4.w;
  //             vec4 local = inverse*vec4(worldCoordinate,1.0);
  //             local.z = 0.0;
  //             if(local.x>rect.x && local.x<rect.z && local.y<rect.w && local.y>rect.y){
  //                     out_FragColor.r = 1.0;
  //                 }
  //         }
  //     }
  //   `;
  //   const postProcessStage = new Cesium.PostProcessStage({
  //     fragmentShader:fs,
  //     uniforms:{
  //         inverse:inverse,
  //         rect:rect
  //     }
  //   })
  //   viewer.scene.postProcessStages.add(postProcessStage)

  // 黑夜
  //   const fragmentShaderSource = `
  //     float getDistance(sampler2D depthTexture, vec2 texCoords)
  //     {
  //         float depth = czm_unpackDepth(texture(depthTexture, texCoords));
  //         if (depth == 0.0) {
  //             return czm_infinity;
  //         }
  //         vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
  //         return -eyeCoordinate.z / eyeCoordinate.w;
  //     }
  //     float interpolateByDistance(vec4 nearFarScalar, float distance)
  //     {
  //         float startDistance = nearFarScalar.x;
  //         float startValue = nearFarScalar.y;
  //         float endDistance = nearFarScalar.z;
  //         float endValue = nearFarScalar.w;
  //         float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
  //         return mix(startValue, endValue, t);
  //     }
  //     vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor)
  //     {
  //         return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a);
  //     }
  //     uniform sampler2D colorTexture;
  //     uniform sampler2D depthTexture;
  //     uniform vec4 fogByDistance;
  //     uniform vec4 fogColor;
  //     in vec2 v_textureCoordinates;
  //     void main(void)
  //     {
  //         float distance = getDistance(depthTexture, v_textureCoordinates); //获取当前像素到相机的距离
  //         vec4 sceneColor = texture(colorTexture, v_textureCoordinates); //场景原有的颜色
  //         float blendAmount = interpolateByDistance(fogByDistance, distance); //根据距离计算雾化
  //         vec4 finalFogColor = vec4(fogColor.rgb, fogColor.a * blendAmount); //计算颜色
  //         out_FragColor = alphaBlend(finalFogColor, sceneColor); //混合场景原有的颜色和雾化颜色
  //     }
  //     `;

  //   const postProcessStage = viewer.scene.postProcessStages.add(
  //     new Cesium.PostProcessStage({
  //       fragmentShader: fragmentShaderSource,
  //       uniforms: {
  //         fogByDistance: new Cesium.Cartesian4(10, 0.0, 2000, 1.0), //雾化参数 10米的时候为0 200米的时候完全雾化
  //         fogColor: Cesium.Color.BLACK, //雾化颜色 设置为黑色
  //       },
  //     })
  //   );
  //   viewer.scene.postProcessStages.add(postProcessStage);

  // 高度雾
  // const fs = `
  //       uniform sampler2D colorTexture;
  //       uniform sampler2D depthTexture;
  //       uniform vec4 fogByHeight;
  //       uniform vec4 fogColor;
  //       in vec2 v_textureCoordinates;
  //       uniform float earthRadius;

  //       float getHeight(sampler2D depthTexture, vec2 texCoords){
  //           float depth = czm_unpackDepth(texture(depthTexture, texCoords));
  //           if(depth==0.0){
  //               return czm_infinity;
  //           }
  //           vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy,depth);
  //           vec3 eyeCoordinate3 = eyeCoordinate4.xyz/eyeCoordinate4.w;
  //           vec4 worldCoordinate4 = czm_inverseView* vec4(eyeCoordinate3.xyz,1.0);
  //           vec3 worldCoordinate = worldCoordinate4.xyz/worldCoordinate4.w;
  //           float altitude = length(worldCoordinate.xyz)-earthRadius; // 当前高度
  //           return altitude;
  //       }
  //       float interpolateByDistance(vec4 nearFarScalar, float distance){
  //           float startDistance = nearFarScalar.x;
  //           float startValue = nearFarScalar.y;
  //           float endDistance = nearFarScalar.z;
  //           float endValue = nearFarScalar.w;
  //           float t = clamp((distance-startDistance)/(endDistance-startDistance),0.0,1.0);
  //           return mix(startValue,endValue,t);
  //       }
  //       vec4 alphaBlend(vec4 sourceColor,vec4 destinationColor){
  //           return sourceColor*vec4(sourceColor.aaa,1.0)+destinationColor*(1.0-sourceColor.a);

  //       }
  //       void main(){
  //           float height = getHeight(depthTexture,v_textureCoordinates);
  //           vec4 sceneColor = texture(colorTexture,v_textureCoordinates);
  //           float blendAmount = interpolateByDistance(fogByHeight,height);
  //           vec4 finalFogColor = vec4(fogColor.rgb,fogColor.a*blendAmount);
  //           out_FragColor = alphaBlend(finalFogColor,sceneColor);
  //       }
  //   `;
  // const camera = viewer.camera;
  // const postProcessStage = new Cesium.PostProcessStage({
  //   fragmentShader: fs,
  //   uniforms: {
  //     fogByHeight: new Cesium.Cartesian4(450, 1, 1000, 0.0),
  //     fogColor: new Cesium.Color(1.0, 1.0, 1.0, 0.8),
  //     earthRadius: (e) => {
  //       return (
  //         Cesium.Cartesian3.magnitude(camera.positionWC) -
  //         camera.positionCartographic.height
  //       );
  //     },
  //   },
  // });
  // viewer.scene.postProcessStages.add(postProcessStage);

  //   // 积雪
  //     const fs = `
  //         uniform sampler2D colorTexture;
  //         uniform sampler2D depthTexture;
  //         in vec2 v_textureCoordinates;
  //         uniform vec3 snowColor;
  //         void main(){
  //             vec4 color = texture(colorTexture,v_textureCoordinates);
  //             out_FragColor = color;
  //             float depth = czm_unpackDepth(texture(depthTexture,v_textureCoordinates));
  //             if(depth<1.0){
  //                 vec4 eyeCoordinate4 = czm_windowToEyeCoordinates(gl_FragCoord.xy,depth);
  //                 vec4 positionEC = eyeCoordinate4/eyeCoordinate4.w;
  //                 vec3 dx = dFdx(positionEC.xyz);
  //                 vec3 dy = dFdy(positionEC.xyz);
  //                 vec3 nor = normalize(cross(dx,dy));
  //                 vec4 positionWC = normalize(czm_inverseView*positionEC);
  //                 vec3 normalWC = normalize(czm_inverseViewRotation*nor);
  //                 float dotNuMWC=  dot(positionWC.xyz,normalWC);
  //                 out_FragColor = mix(color,vec4(snowColor,1.0),dotNuMWC);
  //             }
  //         }
  //     `
  //     const postProcessStage = new Cesium.PostProcessStage({
  //         fragmentShader:fs,
  //         uniforms:{
  //             snowColor:Cesium.Color.WHITE,
  //         }
  //     })
  //     viewer.scene.postProcessStages.add(postProcessStage);

  // 浓度积分高度雾
  const fs = `
uniform sampler2D colorTexture;  // 颜色纹理
uniform sampler2D depthTexture;  // 深度纹理
in vec2 v_textureCoordinates;  // 纹理坐标
uniform float u_earthRadiusOnCamera;
uniform float u_cameraHeight;
uniform float u_fogHeight;
uniform vec3 u_fogColor;
uniform float u_fogStartDis;
uniform float u_heightFalloff;
uniform float u_globalDensity;
// 通过深度纹理与纹理坐标得到世界坐标
vec4 getWorldCoordinate(sampler2D depthTexture, vec2 texCoords) {
	float depthOrLogDepth = czm_unpackDepth(texture(depthTexture, texCoords));
	vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depthOrLogDepth);
	eyeCoordinate = eyeCoordinate / eyeCoordinate.w;
	vec4 worldCoordinate = czm_inverseView * eyeCoordinate;
	worldCoordinate = worldCoordinate / worldCoordinate.w;
	return worldCoordinate;
}
// 计算粗略的高程，依赖js传递的相机位置处的地球高程u_earthRadiusOnCamera。好处是计算量非常低
float getRoughHeight(vec4 worldCoordinate) {
	float disToCenter = length(vec3(worldCoordinate));
	return disToCenter - u_earthRadiusOnCamera;
}
// 得到a向量在b向量的投影长度，如果同向结果为正，异向结果为复
float projectVector(vec3 a, vec3 b) {
	float scale = dot(a, b) / dot(b, b);
	float k = scale / abs(scale);
	return k * length(scale * b);
}
// 浓度积分高度雾
float linearHeightFog(vec3 positionToCamera, float cameraHeight, float pixelHeight, float fogMaxHeight) {
	float globalDensity = u_globalDensity / 10.0;
	vec3 up = -1.0 * normalize(czm_viewerPositionWC);
	float vh = projectVector(normalize(positionToCamera), up);
  // 让相机沿着视线方向移动 雾气产生距离的距离
  float s = step(u_fogStartDis,length(positionToCamera));
  vec3 sub = mix(positionToCamera,normalize(positionToCamera)*u_fogStartDis,s);
  positionToCamera -= sub;
  cameraHeight =  mix(pixelHeight,cameraHeight-u_fogStartDis*vh,s);
	float b = mix(cameraHeight, fogMaxHeight, step(fogMaxHeight, cameraHeight));
	float a = mix(pixelHeight, fogMaxHeight, step(fogMaxHeight, pixelHeight));
	float fog = (b - a) - 0.5 * (pow(b, 2.0) - pow(a, 2.0)) / fogMaxHeight;
	fog = globalDensity * fog / vh;
  if(abs(vh)<=0.01 && cameraHeight<fogMaxHeight){
    float disToCamera = length(positionToCamera);
    fog = globalDensity*(1.0-cameraHeight/fogMaxHeight)*disToCamera;
  }
	// fog = mix(0.0, 1.0,clamp(fog / (fog + 1.0),0.0,1.0) );
  fog = mix(0.0, 1.0,fog / (fog + 1.0) );
	return fog;
}
  // 指数浓度积分高度雾
float exponentialHeightFog(vec3 positionToCamera, float cameraHeight, float pixelHeight, float fogMaxHeight) {
	float globalDensity = u_globalDensity / 10.0;
	vec3 up = -1.0 * normalize(czm_viewerPositionWC);
	float vh = projectVector(normalize(positionToCamera), up);
 
	// 让相机沿着视线方向移动 雾气产生距离 的距离
	float s = step(u_fogStartDis, length(positionToCamera));
	vec3 sub = mix(positionToCamera, normalize(positionToCamera) * u_fogStartDis, s);
	positionToCamera -= sub;
	cameraHeight = mix(pixelHeight, cameraHeight - u_fogStartDis * vh, s);
 
	float b = mix(cameraHeight, fogMaxHeight, step(fogMaxHeight, cameraHeight));
	float a = mix(pixelHeight, fogMaxHeight, step(fogMaxHeight, pixelHeight));
 
	float k = (-globalDensity / u_heightFalloff);
	float fog = k / vh * (exp(-u_heightFalloff * b) - exp(-u_heightFalloff * a));
 
	if(abs(vh) <= 0.003 && cameraHeight < fogMaxHeight) {
		float disToCamera = length(positionToCamera);
		fog = globalDensity * exp(-u_heightFalloff * cameraHeight) * disToCamera;
	}
 
	 fog = mix(0.0, 1.0,clamp(fog / (fog + 1.0),0.0,1.0) );
	return fog;
}
void main(void) {
	vec4 color = texture(colorTexture, v_textureCoordinates);
	vec4 positionWC = getWorldCoordinate(depthTexture, v_textureCoordinates);
	float pixelHeight = getRoughHeight(positionWC);
	vec3 positionToCamera = vec3(vec3(positionWC) - czm_viewerPositionWC);
	float fog = exponentialHeightFog(positionToCamera, u_cameraHeight, pixelHeight, u_fogHeight);
	out_FragColor = mix(color, vec4(u_fogColor, 1.0), fog);
}`;

  const customPostProcessStage = new Cesium.PostProcessStage({
    fragmentShader: fs,
    uniforms: {
      u_earthRadiusOnCamera: () =>
        Cesium.Cartesian3.magnitude(viewer.camera.positionWC) -
        viewer.camera.positionCartographic.height,
      u_cameraHeight: () => viewer.camera.positionCartographic.height,
      u_fogColor: () => new Cesium.Color(0.8, 0.82, 0.84),
      u_fogHeight: () => 1200,
      u_globalDensity: () => 0.6,
      u_fogStartDis: () => 500,
      u_heightFalloff:0.004,
    },
  });

  viewer.scene.postProcessStages.add(customPostProcessStage);

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(104.08, 30.425, 1000),
    orientation: {
      pitch: Cesium.Math.toRadians(-60.0),
    },
  });
});
watchEffect(() => {});
defineExpose({
  ...toRefs(data),
});
</script>
<style scoped lang="scss"></style>
