
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
        this.computed = false
    }
    createCommand = async (fragmeState, modelMatrix) => {
        const context = fragmeState.context;
        const strPickId = 'czm_pickColor';
        const tempColors = []
        let attributes = [];
        let highPositionArray, lowPositionArray
        const options = {
            features: this.features,
            tempColors: tempColors
        }


        for (let index = 0; index < this.features.length; index++) {
            const element = this.features[index];
            const geometryPickId = context.createPickId({
                geometry: element.geometry,
                primitive: this,
                description: `实例id：${this.features[index].id}`,
                id: this.features[index].id
                // color: color,
            })
            const pickColor = geometryPickId.color;
            tempColors.push(pickColor);
            geometryPickId.pickId = geometryPickId;

            this.pickIds.push(geometryPickId)

        }
        const result = this.computeData(options);
        result.then(res => {
            highPositionArray = res.highPositionArray;
            lowPositionArray = res.lowPositionArray;
            const lowPositionTypedArray = new Float32Array(lowPositionArray);
            const highPositionTypedArray = new Float32Array(highPositionArray);
            const stTypedArray = res.stTypedArray;
            const normalTypedArray = res.normalTypedArray;
            const colorTypedArray = res.colorTypedArray;
            const indexTypedArray = res.indexTypedArray;
            const indexBuffer = Cesium.Buffer.createIndexBuffer({
                context: context,
                typedArray: indexTypedArray,
                indexDatatype: Cesium.ComponentDatatype.fromTypedArray(
                    indexTypedArray
                ),
                usage: Cesium.BufferUsage.STATIC_DRAW,
            });
            attributes.push(this.addAttributes(0, this.createVertexBuffer(context, lowPositionTypedArray), 3, lowPositionTypedArray))
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

        })



    }


    computeData(options) {
        return new Promise(rsolve => {
            const worker = new Worker(new URL('/public/worker/webworker_test.js', import.meta.url), {
                type: 'module'
            })
            worker.postMessage(options)
            worker.onmessage = e => {

                rsolve(e.data)
                worker.terminate();
            }
        })
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
        if (!this.show) {
            return
        }
        if (!this.drawCommand && !this.computed) {
            this.createCommand(fragmeState, this._modelMatrix)
            this.computed = true

        } else if (!this.drawCommand && this.computed) {
            return
        }
        else {
            fragmeState.commandList.push(this.drawCommand)
        }

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