import earcut from "earcut"
class PlanPrimitive extends Cesium.Primitive {
    constructor(options) {
        super(options)
        this.features = options.features;
        this.altitude = options.altitude;
        this.boundingSphere;
        this.topAltitude = options.altitude + options.height;
        this._modelMatrix = options.modelMatrix || Cesium.Matrix4.IDENTITY.clone();
        this.drawCommand = null;
        this.pickIds;
        this.pickId;
    }
    createCommand = (fragmeState, modelMatrix) => {
        const context = fragmeState.context;
        let pickId = this.pickId;
        if (!pickId) {
            pickId = context.createPickId({
                primitive: this,
                description: '要素描述内容',
                //[key:string]:any
               
            });
            this.pickId = pickId
        }
        const strPickId = 'czm_pickColor';
     
        const lowPositionArray = []
        const highPositionArray = []
        const indexArray = []
        const uvs = [];
        const colors = [];
        let sequence = 0;
        let attributes = [];
        for (let index = 0; index < this.features.length; index++) {
            const element = this.features[index];
            const rgb = element.properties.RGB.split(",");
            const geometry = element.geometry;
            sequence = this.setData(geometry, lowPositionArray, highPositionArray, indexArray, uvs, colors, rgb, sequence)
            if (index == this.features.length - 1) {

                const positionTypedArray = new Float32Array(lowPositionArray);
                const highPositionTypedArray = new Float32Array(highPositionArray);
                const stTypedArray = new Float32Array(uvs);
                const colorTypedArray = new Float32Array(colors);
                const indexTypedArray = new Uint16Array(indexArray)
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
                attributes.push(this.addAttributes(3, this.createVertexBuffer(context, colorTypedArray), 3, stTypedArray))
                const vertexArray = new Cesium.VertexArray({
                    context: context,
                    attributes: attributes,
                    indexBuffer: indexBuffer,
                });
                const vertexShaderSource = `
                        in vec3 position3DLow;
                        in vec3 position3DHigh;
                        in vec2 a_uv;
                        in vec3 a_color;


                        out vec2 v_uv;
                        out vec4 v_positionEC;
                        out vec3 v_color;
                        out vec4 ${strPickId};
                        vec4 computePosition(vec3 high , vec3 low){
                            return czm_translateRelativeToEye(high,low);
                        }
                        void main() {
                            ${strPickId} = vec4(a_color.rgb,1.0);
                            vec4 p = computePosition(position3DHigh.xyz , position3DLow.xyz);
                            vec4 positionEC = (czm_modelViewRelativeToEye * p);//世界坐标
                            vec4 positionMC = czm_inverseModelView  * vec4(positionEC.xyz, 1.0);//模型坐标
                            v_color = a_color;
                            v_uv = a_uv;
                            v_positionEC = positionEC;
                            gl_Position = czm_modelViewProjectionRelativeToEye * p;
                        }
                    `
                const fragmentShaderSource = `
                    precision  highp  float;
                    // uniform float time;
                    // uniform float resolution;

                    in vec3 v_color;
                    in vec2 v_uv;
                    in vec4 v_positionEC;
                    in vec4 ${strPickId};
                    void main(){
                        out_FragColor = vec4(v_color.rgb,v_uv.y*0.9);
                    }
                    `
                const attributeLocations = {
                    "position3DLow": 0,
                    "position3DHigh": 1,
                    "a_uv": 2,
                    "a_color": 3,
                }

                const shaderProgram = Cesium.ShaderProgram.fromCache({
                    context: context,
                    vertexShaderSource: vertexShaderSource,
                    fragmentShaderSource: fragmentShaderSource,
                    attributeLocations: attributeLocations,
                });

                const renderState = Cesium.RenderState.fromCache({
                    frontFace : Cesium.WindingOrder.COUNTER_CLOCKWISE,  // CLOCKWISE COUNTER_CLOCKWISE 缠绕顺序定义了一个三角形被视为正面的顶点的顺序。  顺时针/逆时针
                    depthTest: {
                        enabled: true,
                        
                    },
                    cull : {
                        enabled : false,
                        face : Cesium.CullFace.BACK   // FRONT  BACK FRONT_AND_BACK  正面/背面 三角形被剔除
                    },
                });

                this.boundingSphere = Cesium.BoundingSphere.fromEncodedCartesianVertices(highPositionArray, lowPositionArray)
                this.drawCommand = new Cesium.DrawCommand({
                    modelMatrix: modelMatrix,
                    vertexArray: vertexArray,
                    shaderProgram: shaderProgram,
                    renderState: renderState,
                    pass: Cesium.Pass.TRANSLUCENT, //OPAQUE,OVERLAY,TRANSLUCENT
                    boundingVolume: Cesium.BoundingSphere.fromEncodedCartesianVertices(highPositionArray, lowPositionArray),
                    // count: indexCount,
                    primitiveType: Cesium.PrimitiveType.TRIANGLES,
                    // uniformMap: {

                    //     color() {
                    //         return new Cesium.Color(1.0, 0.5, 0.0)
                    //     },

                    // },
                    pickId:strPickId
                })
            }

        }

    }
    setPickId(feature, geometry, context) {
        //创建pickId
        const pickId = context.createPickId({
            feature: feature,
            primitive: this
        })
        //保存pickId，用于后期处理、释放等
        this.pickIds.push(pickId);
    
        //增加几何顶点属性pickColor，这里属性名称和顶点着色器里面的对应attribute变量名称一致
    
        const ptCount = geometry.attributes.position.values.length / 3
        let pickColors = [], { red, green, blue, alpha } = pickId.color;
        for (let i = 0; i < ptCount; i++) {
            pickColors.push(red, green, blue, alpha)
        }
        pickColors = new Float32Array(pickColors);
    
        geometry.attributes.pickColor = new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.FLOAT,
            componentsPerAttribute: 4,
            normalize: false,
            values: pickColors
        })
    }
    setData(geometry, lowPositionArray, highPositionArray, indexArray, uvs, colors, rgb, sequence) {
        const coordinates = geometry.coordinates[0][0];
        const points = []
        const point = [coordinates[0][0], coordinates[0][1], this.altitude];
        const topPoint = [coordinates[0][0], coordinates[0][1], this.topAltitude];
        this.getCartesian3(point, lowPositionArray, highPositionArray, colors, rgb);
        this.getCartesian3(topPoint, lowPositionArray, highPositionArray, colors, rgb);
        points.push(topPoint[0], topPoint[1], topPoint[2])
        const first = sequence;
         
        for (let index = 1; index < coordinates.length; index++) {
            const point = [coordinates[index][0], coordinates[index][1], this.altitude];
            const topPoint = [coordinates[index][0], coordinates[index][1], this.topAltitude]
            this.getCartesian3(point, lowPositionArray, highPositionArray, colors, rgb);
            this.getCartesian3(topPoint, lowPositionArray, highPositionArray, colors, rgb);
            points.push(topPoint[0], topPoint[1], topPoint[2])
            indexArray.push(sequence * 2 + 1, sequence * 2, sequence * 2 + 2, sequence * 2 + 2, sequence * 2 + 3, sequence * 2 + 1);
            uvs.push(0, 0, 0, 1, 1, 0, 1, 1);
            if (index == coordinates.length - 1) {
                const triangles = earcut(points, null, 3)
                triangles.forEach(item => {
                    indexArray.push((first + item) * 2 + 1)
                })
            }
            sequence++
        }


        sequence++
        return sequence;

    }
    getCartesian3(points, lowArray, highArray, colors, rgb) {
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
        colors.push(Number(rgb[0]) / 255, Number(rgb[1]) / 255, Number(rgb[2]) / 255)
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
export { PlanPrimitive }