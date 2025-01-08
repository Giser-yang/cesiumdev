import earcut from "earcut"
class PickPrimitive extends Cesium.Primitive {
    constructor(options) {
        super(options)
        this.features = options.features;
        this.altitude = options.altitude;
        this.boundingSphere;
        this.topAltitude = options.altitude + options.height;
        this._modelMatrix = options.modelMatrix || Cesium.Matrix4.IDENTITY.clone();
        this.drawCommand = null;
        this.pickIds = [];
        this.pickId;
    }
    createCommand = (fragmeState, modelMatrix) => {
        const context = fragmeState.context;
        const strPickId = 'czm_pickColor';

        const lowPositionArray = []
        const highPositionArray = []
        const indexArray = []
        const uvs = [];
        const normals = [];
        const pickColors = [];
        let sequence = 0;
        let attributes = [];
        console.time("计算")
        for (let index = 0; index < this.features.length; index++) {
            const element = this.features[index];
            const geometryPickId = context.createPickId({
                geometry: element.geometry,
                primitive: this,
                description: `实例id：${this.features[index].id}`,
                id:this.features[index].id
                // color: color,
            })
            const pickColor = geometryPickId.color;
            geometryPickId.pickId = geometryPickId;
    
            this.pickIds.push(geometryPickId)
            sequence = this.setData(element, lowPositionArray, highPositionArray, indexArray, uvs, normals,pickColors,pickColor, sequence)
            if (index == this.features.length - 1) {
                
                const positionTypedArray = new Float32Array(lowPositionArray);
                const highPositionTypedArray = new Float32Array(highPositionArray);
                const stTypedArray = new Float32Array(uvs);
                const normalTypedArray = new Float32Array(normals);
                const colorTypedArray = new Float32Array(pickColors);
                const indexTypedArray = new Uint32Array(indexArray)
                const indexBuffer = Cesium.Buffer.createIndexBuffer({
                    context: context,
                    typedArray: indexTypedArray,
                    indexDatatype: Cesium.ComponentDatatype.fromTypedArray(
                        indexTypedArray
                    ),
                    usage: Cesium.BufferUsage.STATIC_DRAW,
                });
                attributes.push(this.addAttributes(0, this.createVertexBuffer(context, positionTypedArray), 3, positionTypedArray))
                attributes.push(this.addAttributes(1, this.createVertexBuffer(context, highPositionTypedArray), 3, highPositionTypedArray))
                attributes.push(this.addAttributes(2, this.createVertexBuffer(context, stTypedArray), 2, stTypedArray))
                attributes.push(this.addAttributes(3, this.createVertexBuffer(context, colorTypedArray), 4, colorTypedArray))
                attributes.push(this.addAttributes(4, this.createVertexBuffer(context, normalTypedArray), 3, normalTypedArray))
                const vertexArray = new Cesium.VertexArray({
                    context: context,
                    attributes: attributes,
                    indexBuffer: indexBuffer,
                });
                const vertexShaderSource = `
                        in vec3 position3DLow;
                        in vec3 position3DHigh;
                        in vec2 a_uv;
                        in vec4 pickColor;
                        in vec3 a_normal;

                        out vec4 ${strPickId};
                        out vec2 v_uv;
                        out vec3 v_positionEC;
                        out vec3 v_normalEC;
                        // out vec4 v_color;
                        vec4 computePosition(vec3 high , vec3 low){
                                    return czm_translateRelativeToEye(high,low);
                                }
                        void main()
                        {
                            vec4 p = computePosition(position3DHigh.xyz , position3DLow.xyz);
                            v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
                            v_normalEC = czm_normal * a_normal;                         // normal in eye coordinates
                            // v_color = a_color;
                            ${strPickId} = pickColor;
                            v_uv = a_uv;
                            gl_Position = czm_modelViewProjectionRelativeToEye * p;
                        }
                    `
                const fragmentShaderSource = `
                        in vec3 v_positionEC;
                        in vec3 v_normalEC;
                        in vec2 v_uv;
                        in vec4 ${strPickId};
                        void main()
                        {
                            vec3 positionToEyeEC = -v_positionEC;
                            vec3 normalEC = normalize(v_normalEC);
                        #ifdef FACE_FORWARD
                            normalEC = faceforward(normalEC, vec3(0.0, 0.0, 1.0), -normalEC);
                        #endif
                            
                            vec4 color = czm_gammaCorrect(vec4(0.8,0.8,0.8,1.0));
                            czm_materialInput materialInput;
                            materialInput.normalEC = normalEC;
                            materialInput.positionToEyeEC = positionToEyeEC;
                            czm_material material = czm_getDefaultMaterial(materialInput);
                            material.diffuse = color.rgb;
                            material.alpha = color.a;

                            out_FragColor = czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC);
                        }

                    `
                const attributeLocations = {
                    "position3DLow": 0,
                    "position3DHigh": 1,
                    "a_uv": 2,
                    "pickColor": 3,
                    "a_normal": 4
                }

                const shaderProgram = Cesium.ShaderProgram.fromCache({
                    context: context,
                    vertexShaderSource: vertexShaderSource,
                    fragmentShaderSource: fragmentShaderSource,
                    attributeLocations: attributeLocations,
                });

                const renderState = Cesium.RenderState.fromCache({
                    frontFace: Cesium.WindingOrder.COUNTER_CLOCKWISE,  // CLOCKWISE COUNTER_CLOCKWISE 缠绕顺序定义了一个三角形被视为正面的顶点的顺序。  顺时针/逆时针
                    depthTest: {
                        enabled: true,

                    },
                    cull: {
                        enabled: false,
                        face: Cesium.CullFace.BACK   // FRONT  BACK FRONT_AND_BACK  正面/背面 三角形被剔除
                    },
                });

                this.boundingSphere = Cesium.BoundingSphere.fromEncodedCartesianVertices(highPositionArray, lowPositionArray)
                this.drawCommand = new Cesium.DrawCommand({
                    modelMatrix: modelMatrix,
                    vertexArray: vertexArray,
                    shaderProgram: shaderProgram,
                    renderState: renderState,
                    pass: Cesium.Pass.OPAQUE, //OPAQUE,OVERLAY,TRANSLUCENT
                    boundingVolume: Cesium.BoundingSphere.fromEncodedCartesianVertices(highPositionArray, lowPositionArray),
                    // count: indexCount,
                    primitiveType: Cesium.PrimitiveType.TRIANGLES,
                    uniformMap: {

                        color() {
                            return new Cesium.Color(1.0, 0.5, 0.0)
                        },

                    },
                    pickId: strPickId,
                    // instanceCount:this.features.length
                })
                console.timeEnd("计算")
            }

        }

    }



    setData(element, lowPositionArray, highPositionArray, indexArray, uvs, normals,pickColors,pickColor, sequence) {
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
            this.getCartesian3(pointBot, lowPositionArray, highPositionArray,pickColors,pickColor);
            this.getCartesian3(nextPointBot, lowPositionArray, highPositionArray,pickColors,pickColor);
            this.getCartesian3(nextPointTop, lowPositionArray, highPositionArray,pickColors,pickColor);
            this.getCartesian3(nextPointTop, lowPositionArray, highPositionArray,pickColors,pickColor);
            this.getCartesian3(pointTop, lowPositionArray, highPositionArray,pickColors,pickColor);
            this.getCartesian3(pointBot, lowPositionArray, highPositionArray,pickColors,pickColor);
            if (index == 1) {
                points.push(...pointTop);
            }
            points.push(...nextPointTop);

            indexArray.push(sequence, sequence + 1, sequence + 2, sequence + 3, sequence + 4, sequence + 5);
            uvs.push(0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0);
            this.setNormal([pointBot, nextPointBot, nextPointTop], normals);
            this.setNormal([nextPointTop, pointTop, pointBot], normals);



            sequence += 6
            if (index == coordinates.length - 1) {
                const triangles = earcut(points, null, 3)
                for (let j = 0; j < triangles.length;) {
                    const point1 = points.slice(triangles[j] * 3, triangles[j] * 3 + 3);
                    const point2 = points.slice(triangles[j + 1] * 3, triangles[j + 1] * 3 + 3);
                    const point3 = points.slice(triangles[j + 2] * 3, triangles[j + 2] * 3 + 3);
                    this.getCartesian3(point1, lowPositionArray, highPositionArray,pickColors,pickColor);
                    this.getCartesian3(point2, lowPositionArray, highPositionArray,pickColors,pickColor);
                    this.getCartesian3(point3, lowPositionArray, highPositionArray,pickColors,pickColor);
                    this.setNormal([point1, point2, point3], normals)
                    indexArray.push(sequence, sequence + 1, sequence + 2);
                    sequence += 3
                    j += 3;
                }
            }
        }
        return sequence;
    }
    setNormal(points, normals) {
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
    getCartesian3(points, lowArray, highArray,pickColors,pickColor) {
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
    createVertexBuffer(context, typedArray) {
        return Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: typedArray,
            usage: Cesium.BufferUsage.STATIC_DRAW
        })
    }
    addAttributes(index, buffer, per, TypedArray) {
        return {
            index: index,
            enabled: true,
            vertexBuffer: buffer,
            componentsPerAttribute: per,
            componentDatatype: Cesium.ComponentDatatype.fromTypedArray(
                TypedArray
            ),
        }
    }
    update = (fragmeState) => {
        if (!this.drawCommand) {
            this.createCommand(fragmeState, this._modelMatrix)
        }
        if (!this.show) {
            return
        }
        fragmeState.commandList.push(this.drawCommand)
    }
    destroy() {
        var drawCommand = this.drawCommand;
        if (drawCommand) {
            var va = drawCommand.vertexArray, sp = drawCommand.shaderProgram;
            if (!va.isDestroyed()) va.destroy();
            if (!sp.isDestroyed || !sp.isDestroyed()) {
                sp.destroy();
            }
            drawCommand.isDestroyed = function returnTrue() {
                return true
            };
            drawCommand.uniformMap = undefined;
            drawCommand.renderState = Cesium.RenderState.removeFromCache(drawCommand.renderState)
            this.drawCommand = null
        }
        //单个要素的pickId
        if (this.pickId) {
            this.pickId.destroy()
            this.pickId = null
        }
        //多个要素的pickId
        if (this.pickIds) {
            this.pickIds.forEach(pickId => {
                pickId.destroy()
            })
            this.pickIds.length = 0;
        }
    }
}
export { PickPrimitive }