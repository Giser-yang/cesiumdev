import * as earcut from "earcut"



class CustomPolygonPrimitive extends Cesium.Primitive {
    constructor(options) {
        super(options)
        this.coordinates = options.coordinates;
        this._modelMatrix = options.modelMatrix || Cesium.Matrix4.IDENTITY.clone();
    }
    createCommand = (fragmeState, modelMatrix) => {
        console.log('coordinates', this.coordinates);

        const context = fragmeState.context;
        const positionArray = []
        const boundingSphere = []
        let tempCartesian3
        const points = this.coordinates.flat(2);

        let triangles;
        for (let i = 0; i < points.length;) {
            console.log(points[i], points[i + 1]);
            tempCartesian3 = Cesium.Cartesian3.fromDegrees(points[i], points[i + 1], 550)
            positionArray.push(tempCartesian3.x, tempCartesian3.y, tempCartesian3.z)
            boundingSphere.push(tempCartesian3)
            i += 2
            if (i >= points.length) {
                const positionTypedArray = new Float32Array(positionArray);
                triangles = earcut.default(positionArray, null, 3)
                const indexTypedArray = new Uint16Array(triangles)
                const positionBuffer = Cesium.Buffer.createVertexBuffer({
                    context: context,
                    typedArray: positionTypedArray,
                    usage: Cesium.BufferUsage.STATIC_DRAW
                });
                const indexBuffer = Cesium.Buffer.createIndexBuffer({
                    context: context,
                    typedArray: indexTypedArray,
                    indexDatatype: Cesium.ComponentDatatype.fromTypedArray(
                        indexTypedArray
                    ),
                    usage: Cesium.BufferUsage.STATIC_DRAW,
                });
                const attributes = [
                    {
                        index: 0,
                        enabled: true,
                        vertexBuffer: positionBuffer,
                        componentsPerAttribute: 3,
                        componentDatatype: Cesium.ComponentDatatype.fromTypedArray(
                            positionTypedArray
                        ),
                        // normalize: false,
                        // offsetInBytes: 0,
                        // strideInBytes: 0,  // tightly packed
                        // instanceDivisor: 0 // not instanced
                    }
                ];
                const vertexArray = new Cesium.VertexArray({
                    context: context,
                    attributes: attributes,
                    indexBuffer: indexBuffer,
                });

                const vertexShaderSource = `
                        in vec3 position;
                        void main() {
                            gl_Position = czm_projection * czm_view * czm_model * vec4(position, 1.0);
                        }
                    `
                const fragmentShaderSource = `
                    precision  mediump float;
                    void main(){
                        out_FragColor = vec4(1.0);
                    }
                    `
                const attributeLocations = {
                    "position": 0,
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
                    pass: Cesium.Pass.OPAQUE,
                    // boundingVolume: primitive.boundingSphere,                 
                    // count: indexCount,
                    primitiveType: Cesium.PrimitiveType.TRIANGLES,
                    // uniformMap: uniformMap,
                })
            }
        }

        // console.log('positionArray',positionArray,triangles);

    }

    update = (fragmeState) => {
        const command = this.createCommand(fragmeState, this._modelMatrix);
        fragmeState.commandList.push(command)
    }

}
export { CustomPolygonPrimitive }