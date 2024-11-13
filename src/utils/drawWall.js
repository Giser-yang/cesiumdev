
class CustomWallPrimitive extends Cesium.Primitive {
    constructor(options) {
        super(options)
        this.coordinates = options.coordinates;
        this.altitude = options.altitude;
 
        this.topAltitude = options.altitude+options.height;
        this._modelMatrix = options.modelMatrix || Cesium.Matrix4.IDENTITY.clone();
    }
    createCommand = (fragmeState, modelMatrix) => {
        const context = fragmeState.context;
        const lowPositionArray = []
        const highPositionArray = []
        const indexArray = []
        const attributes = [];
        const uvs = [];
        const boundingSphere = []
        let tempCartesian3
        const points = this.coordinates[0];
        this.getCartesian3([...points[0], this.altitude],lowPositionArray,highPositionArray)
        this.getCartesian3([...points[0], this.topAltitude],lowPositionArray,highPositionArray)
        for (let i = 1; i < points.length;) {
            this.getCartesian3([...points[i], this.altitude],lowPositionArray,highPositionArray)
            this.getCartesian3([...points[i], this.topAltitude],lowPositionArray,highPositionArray)
            indexArray.push((i - 1) * 2 + 1, (i - 1) * 2, (i - 1) * 2 + 2, (i - 1) * 2 + 2, (i - 1) * 2 + 3, (i - 1) * 2 + 1)
            uvs.push(0, 0, 0, 1, 1, 0, 1, 1)
            i++
            if (i >= points.length) {
                const positionTypedArray = new Float32Array(lowPositionArray);
                const highPositionTypedArray = new Float32Array(highPositionArray);
                const stTypedArray = new Float32Array(uvs);
                const indexTypedArray = new Uint16Array(indexArray)
                const indexBuffer = Cesium.Buffer.createIndexBuffer({
                    context: context,
                    typedArray: indexTypedArray,
                    indexDatatype: Cesium.ComponentDatatype.fromTypedArray(
                        indexTypedArray
                    ),
                    usage: Cesium.BufferUsage.STATIC_DRAW,
                });
                attributes.push(this.addAttributes(0,this.createVertexBuffer(context, positionTypedArray),3,positionTypedArray))
                attributes.push(this.addAttributes(1,this.createVertexBuffer(context, highPositionTypedArray),3,highPositionTypedArray))
                attributes.push(this.addAttributes(2,this.createVertexBuffer(context, stTypedArray),2,stTypedArray))
                const vertexArray = new Cesium.VertexArray({
                    context: context,
                    attributes: attributes,
                    indexBuffer: indexBuffer,
                });

                const vertexShaderSource = `
                        in vec3 position3DLow;
                        in vec3 position3DHigh;
                        in vec2 a_uv;

                        out vec2 v_uv;
                        vec4 computePosition(vec3 high , vec3 low){
                            return czm_translateRelativeToEye(high,low);
                        }
                        void main() {
                            vec4 p = computePosition(position3DHigh.xyz , position3DLow.xyz);
                            vec3 positionEC = (czm_modelViewRelativeToEye * p).xyz;//世界坐标
                            vec4 positionMC = czm_inverseModelView  * vec4(positionEC, 1.0);//模型坐标
                            v_uv = a_uv;
                            gl_Position = czm_modelViewProjectionRelativeToEye * p;
                        }
                    `
                const fragmentShaderSource = `
                    precision  mediump float;
                    uniform float time;
                    in vec2 v_uv;
                    void main(){
                        float a=1.0-v_uv.y;
                        if(a<=time){
                            a=1.0;
                        };
                        out_FragColor = vec4(1.0,0.5,0.0,a);
                    }
                    `
                const attributeLocations = {
                    "position3DLow": 0,
                    "position3DHigh":1,
                    "a_uv": 2
                }

                const shaderProgram = Cesium.ShaderProgram.fromCache({
                    context: context,
                    vertexShaderSource: vertexShaderSource,
                    fragmentShaderSource: fragmentShaderSource,
                    attributeLocations: attributeLocations,
                });

                const renderState = Cesium.RenderState.fromCache({
                    depthTest: {
                        enabled: true
                    }
                });

                return new Cesium.DrawCommand({
                    modelMatrix: modelMatrix,
                    vertexArray: vertexArray,
                    shaderProgram: shaderProgram,
                    renderState: renderState,
                    pass: Cesium.Pass.TRANSLUCENT, //OPAQUE,OVERLAY,TRANSLUCENT
                    // boundingVolume: primitive.boundingSphere,                 
                    // count: indexCount,
                    primitiveType: Cesium.PrimitiveType.TRIANGLES,
                    uniformMap: {
                        time(){
                            return window.frameCount%110/109
                        }
                    },
                })
            }
        }

        // console.log('positionArray',positionArray,triangles);

    }
    createVertexBuffer(context, typedArray) {
        return Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: typedArray,
            usage: Cesium.BufferUsage.STATIC_DRAW
        })
    }
    addAttributes(index,buffer,per,TypedArray){
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
    getCartesian3(points,lowArray,highArray){
        const value = Cesium.Cartesian3.fromDegrees(...points);
                // const lonLat = ellipsoid.cartesianToCartographic(
                //     value,
                //     scratchProjectTo2DCartographic
                // );
                // const cartesian = projection.project(
                //     lonLat,
                //     scratchProjectTo2DCartesian3
                // );
                const newCartesian3 =  Cesium.EncodedCartesian3.fromCartesian(value);
                lowArray.push(newCartesian3.low.x,newCartesian3.low.y,newCartesian3.low.z)
                highArray.push(newCartesian3.high.x,newCartesian3.high.y,newCartesian3.high.z)
    }
    update = (fragmeState) => {
        const command = this.createCommand(fragmeState, this._modelMatrix);
        fragmeState.commandList.push(command)
    }

}
export { CustomWallPrimitive }