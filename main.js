var camera = null;
var interactor = null;
var transforms = null;
var useVertexColors = false;
var texture = null;
var cubeTexture = null;

function configure() {
        gl.clearColor(0.3, 0.3, 0.3, 1.0);
        gl.clearDepth(100.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); //Creates and sets up the camera location 
        camera = new Camera(CAMERA_ORBITING_TYPE);
        camera.goHome([0, 0, 4]);
        camera.setFocus([0.0, 0.0, 0.0]);
        camera.setAzimuth(45);
        camera.setElevation(-30);
        camera.hookRenderer = draw; //Creates and sets up the mouse and keyboard interactor 
        interactor = new CameraInteractor(camera, document.getElementById('canvas-element-id')); //Scene Transforms 
        transforms = new SceneTransforms(camera); //init transforms 
        transforms.init(); //Program 
        attributeList = ["aVertexPosition", "aVertexNormal", "aVertexColor", "aVertexTextureCoords"];
        uniformList = ["uPMatrix", "uMVMatrix", "uNMatrix", "uMaterialDiffuse", "uMaterialAmbient", "uLightAmbient", "uLightDiffuse", "uLightPosition", "uWireframe", "uAlpha", "uUseVertexColor", "uUseLambert", "uSampler", "uCubeSampler"];
        Program.load(attributeList, uniformList);
        gl.uniform3fv(Program.uLightPosition, [0, 5, 20]);
        gl.uniform3fv(Program.uLightAmbient, [1.0, 1.0, 1.0, 1.0]);
        gl.uniform4fv(Program.uLightDiffuse, [1.0, 1.0, 1.0, 1.0]);
        gl.uniform1f(Program.uAlpha, 1.0);
        gl.uniform1i(Program.uUseVertexColor, useVertexColors);
        gl.uniform1i(Program.uUseLambert, true); //Init textures 
        texture = new Texture();
        texture.setImage('textures/webgl.png'); //Init Cube map function 

        loadCubemapFace(gl, target, texture, url) {
                var image = new Image();
                image.onload = function() {
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
                }
                image.src = url;
        };
        
        cubeTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeTexture, 'textures/cubemap/positive_x.png');
        loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, cubeTexture, 'textures/cubemap/negative_x.png');
        loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, cubeTexture, 'textures/cubemap/positive_y.png');
        loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, cubeTexture, 'textures/cubemap/negative_y.png');
        loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, cubeTexture, 'textures/cubemap/positive_z.png');
        loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, cubeTexture, 'textures/cubemap/negative_z.png');
} /** * Loads the scene */

function load() {
        Scene.loadObject('models/geometry/complexCube.json', 'cube2');
} /** * invoked on every rendering cycle */
function draw() {
        gl.viewport(0, 0, c_width, c_height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        transforms.updatePerspective();
        try {
                for (var i = 0; i < Scene.objects.length; i++) {
                        var object = Scene.objects[i];
                        if (object.hidden == true) continue;
                        transforms.calculateModelView();
                        transforms.push();
                        transforms.setMatrixUniforms();
                        transforms.pop(); //Setting uniforms 
                        gl.uniform4fv(Program.uMaterialDiffuse, object.diffuse);
                        gl.uniform4fv(Program.uMaterialAmbient, object.ambient);
                        gl.uniform1i(Program.uWireframe, object.wireframe); //Setting attributes 
                        gl.enableVertexAttribArray(Program.aVertexPosition);
                        gl.disableVertexAttribArray(Program.aVertexNormal);
                        gl.disableVertexAttribArray(Program.aVertexColor);
                        gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
                        gl.vertexAttribPointer(Program.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
                        gl.enableVertexAttribArray(Program.aVertexPosition);
                        gl.uniform1i(Program.uUseVertexColor, useVertexColors);
                        if (object.scalars != null && useVertexColors) {
                                gl.enableVertexAttribArray(Program.aVertexColor);
                                gl.bindBuffer(gl.ARRAY_BUFFER, object.cbo);
                                gl.vertexAttribPointer(Program.aVertexColor, 4, gl.FLOAT, false, 0, 0);
                        }
                        if (object.texture_coords) {
                                gl.enableVertexAttribArray(Program.aVertexTextureCoords);
                                gl.bindBuffer(gl.ARRAY_BUFFER, object.tbo);
                                gl.vertexAttribPointer(Program.aVertexTextureCoords, 2, gl.FLOAT, false, 0, 0);
                                gl.activeTexture(gl.TEXTURE0);
                                gl.bindTexture(gl.TEXTURE_2D, texture.tex);
                                gl.uniform1i(Program.uSampler, 0);
                                gl.activeTexture(gl.TEXTURE1);
                                gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
                                gl.uniform1i(Program.uCubeSampler, 1);
                        }
                        if (!object.wireframe) {
                                gl.bindBuffer(gl.ARRAY_BUFFER, object.nbo);
                                gl.vertexAttribPointer(Program.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
                                gl.enableVertexAttribArray(Program.aVertexNormal);
                        }
                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);
                        if (object.wireframe) {
                                gl.drawElements(gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0);
                        } else {
                                gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
                        }
                        gl.bindBuffer(gl.ARRAY_BUFFER, null);
                        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                }
        } catch (err) {
                alert(err);
                console.error(err.description);
        }
} /** * Entry point. This function is invoked when the page is loaded */
var app = null;

function runWebGLApp() {
        app = new WebGLApp("canvas-element-id") app.configureGLHook = configure;
        app.loadSceneHook = load;
        app.drawSceneHook = draw;
        app.run();
}