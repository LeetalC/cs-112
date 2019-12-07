"use strict";

var gl;                 // The webgl context.

var a_coords_loc;       // Location of the a_coords attribute variable in the shader program.
var a_coords_buffer;    // Buffer to hold the values for a_coords.
var a_normal_loc;       // Location of a_normal attribute.
var a_normal_buffer;    // Buffer for a_normal.
var index_buffer;       // Buffer to hold vetex indices from model.

var u_diffuseColor;     // Locations of uniform variables in the shader program
var u_specularColor;
var u_specularExponent;
    

//car light positions
var u_lightPosition;    
var u_pointLightPosition;
var u_carHeadLight1Pos;
var u_carHeadLight2Pos;

var u_modelview;
var u_projection;
var u_normalMatrix;    
var currentModelNumber;  // contains data for the current object

var projection = mat4.create();          // projection matrix
var modelview;                           // modelview matrix; value comes from rotator
var normalMatrix = mat3.create();        // matrix, derived from model and view matrix, for transforming normal vectors
var rotator;                             // A TrackballRotator to implement rotation by mouse.

//animation
var rotatedDegrees = 0;

var inc = 1;
var then = 0;
var modelXRotationRadians = degToRad(0);
var modelYRotationRadians = degToRad(0);

//make scale matrix, transform matrix
var lastTime = 0;
var colors = [  // RGB color arrays for diffuse and specular color values
    [1,1,1],
];

var lightPositions = [  // values for light position
  [0,0,0,1],

];

var objects = [         // Objects for display
   cube(1),
   ring(1,0),
   uvSphere(1),
   uvTorus(2,1),
   uvCylinder(1,1),
   uvCone(1,1),
   ring(1,.99), 
];



function degToRad(degrees) {
  return degrees * Math.PI / 180;
}


function perspective(proj, fov, aspect, n, f)
{   
    var t = n*Math.tan(fov/2);
    var b = -t;
    var l = aspect * t;
    var r = aspect * b;

    var persMat = [((2*n)/(r-l)), 0, 0, 0, 0, ((2*n)/(t-b)), 0, 0, ((r+l)/(r-l)), ((t+b)/(t-b)), (-(f+n)/(f-n)), -1, 0, 0, (-(2*f*n)/(f-n)), 0];
    
    if (document.getElementById("my_gl").checked) mat4.multiply(proj, proj, persMat);
    else mat4.perspective(proj, fov, aspect, n, f);  

    return proj;
}
//done
function translate(modelview, vec)//TODO: function inputs
{
    var transMat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, vec[0], vec[1], vec[2], 1];

    mat4.multiply(modelview, modelview, transMat);

    return modelview;
}
/*keep a vector and rotate it around*/

function rotate(modelview, a, axis) 
{   
    var xMat = [1, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1];
    var yMat = [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1];
    var zMat = [Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

        if(axis == "X") mat4.multiply(modelview,modelview,xMat);
        if(axis == "Y") mat4.multiply(modelview,modelview,yMat);
        if(axis == "Z") mat4.multiply(modelview,modelview,zMat);

    return modelview;
}


function scale(modelview, vec)
{
    var scaleMat = [vec[0], 0, 0, 0, 0, vec[1], 0, 0, 0, 0, vec[2], 0, 0,0,0,1];
    mat4.multiply(modelview, modelview, scaleMat);

    return modelview;
}



function draw() {

    //cube = 0, ring = 1, sphere = 2, torus, = 3, cyl = 4, cone = 5, mini ring = 6
    console.log("in draw");
    gl.clearColor(.05,.05,.08,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotatedDegrees = (rotatedDegrees + 1) % 360;

    mat4.perspective(projection, Math.PI/7, 1, 10, 20 );


    modelview = rotator.getViewMatrix();



    //modelnumber, transvec, scalevec, angle of Rotation, axis of rotation, r, g, b

    //main disc
    drawModel(4, [0,0,0], [2.5,2.5,.18], 0, "N", 35, 153, 84);

    //inner ring for road
    drawModel(1, [0,0,.1], [1,1,.3],0,"N", 44, 62, 80);
    drawModel(6, [0,0,.15], [1.5,1.5,.3],0,"N", 200, 202, 0);
    drawModel(6, [0,0,.15], [1.47,1.47,.3],0,"N", 200, 202, 0);

    //sun
    mat4.rotateY(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(2, [0,0,2.7], [.15,.15,.15], 0,"N", 247, 220, 111);


    //center lamp base
    drawModel(4, [0,0,.09], [.08,.08,.1], 0, "N", 60,60,60);
    drawModel(4, [0,0,.2], [.02,.02,.5], 0, "N", 170, 183, 184);

    //center lamp
    drawModel(2, [0,0,.5], [.05,.05,.05], 0,"N", 234, 237, 237);
    
    //making trees
    placeTrees();


    //the car
    drawCar();

}

function placeTrees() {
    drawTree([.6,0,.2], [.05,.05,.2], [.6,0,.4], [.15,.15,.3]); //big Tree
    drawTree([.6,.3,.2], [.06,.06,.2], [.6,.3,.5], [.16,.16,.4]); //medium Tree
    drawTree([.35,.20,.2], [.02,.02,.2], [.35,.20,.3], [.10,.10,.25]); //small Tree

    drawTree([-.6,0,.2], [.05,.05,.2], [-.6,0,.4], [.15,.15,.3]); //big Tree
    drawTree([-.7,.20,.2], [.02,.02,.2], [-.7,.20,.3], [.10,.10,.25]); //small Tree
    drawTree([-2.2,0,.2], [.05,.05,.2], [-2.2,0,.4], [.15,.15,.3]); //big Tree
    drawTree([-2.2,.2,.2], [.06,.06,.2], [-2.2,.2,.5], [.16,.16,.4]); //medium Tree
    drawTree([0,2.2,.2], [.06,.06,.2], [0,2.2,.5], [.16,.16,.4]); //medium Tree
    drawTree([.8,-2.2,.2], [.02,.02,.2], [.8,-2.2,.3], [.10,.10,.25]); //small Tree
    drawTree([.65,-2.2,.2], [.02,.02,.2], [.65,-2.2,.3], [.10,.10,.25]); //small Tree
}

function drawModel(modelNum, transVec, scaleVec, angle, axis, r, g, b){
    installModel(objects[modelNum]);
    gl.uniform4f(u_diffuseColor, r/255, g/255, b/255, 1);
    translate(modelview, transVec);
    scale(modelview,scaleVec);

    if(axis == "X") mat4.rotateX(modelview,modelview,degToRad(angle));
    if(axis == "Y") mat4.rotateY(modelview,modelview,degToRad(angle));
    if(axis == "Z") mat4.rotateZ(modelview,modelview,degToRad(angle));

    update_uniform(modelview, projection, modelNum);
    modelview = rotator.getViewMatrix();

}

function drawTree(baseTrans, baseScale, topTrans, topScale){
    drawModel(4, baseTrans, baseScale, 0, "N", 123, 36, 28);
    drawModel(5, topTrans, topScale, 0, "N", 22, 160, 133);
}

function drawCar(){
    //yes i know this is horirble but it works.
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(0, [0,1.7,.3], [.7,.4,.2],0, 230, 126, 34);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(0, [0,1.7,.4], [.4,.3,.2],0, 211, 84, 0);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(3, [-.2,1.95, .25], [.07,.07,.07], 90, "X", 10,10,10);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(3, [.2,1.95, .25], [.07,.07,.07], 90, "X", 10,10,10);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(3, [-.2,1.45, .25], [.07,.07,.07], 90, "X", 10,10,10);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(3, [.2,1.45, .25], [.07,.07,.07], 90, "X", 10,10,10);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(4, [-.25,1.85,.5], [.005,.005,.5], 0, "N", 170, 183, 184);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(2, [-.35, 1.8, .3], [.05, .05, .05], 0, "N", 255,255,153);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(2, [-.35, 1.6, .3], [.05, .05, .05], 0, "N", 255,255,153);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(4, [-.2, 1.7, .25], [.03, .6, .03], 90, "X", 200,200,200);
    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(4, [.2, 1.7, .25], [.03, .6, .03], 90, "X", 200,200,200);

    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(4, [-.2,1.45,.25], [.15,.03,.03], 90, "Y", 200,200,200);

    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));

  //  mat4.rotateY(modelview,modelview, degToRad(rotatedDegrees));
    drawModel(4, [.2,1.45,.25], [.15,.03,.03], 90, "Y", 200,200,200);

    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(4, [-.2,1.97,.25], [.15,.03,.03], 90, "Y", 200,200,200);

    mat4.rotateZ(modelview, modelview, degToRad(rotatedDegrees));
    drawModel(4, [.2,1.97,.25], [.15,.03,.03], 90, "Y", 200,200,200);

    //array of lights
    //point light is at a point and goes around it
    //directional light goes in a direction. you provide the normalized vector of where the light should fall
    //for a point light, you provide a position of the light
    //distance from the light position

}

/*
  this function assigns the computed values to the uniforms for the model, view and projection
  transform
*/
function update_uniform(modelview,projection,currentModelNumber){
    /* Get the matrix for transforming normal vectors from the modelview matrix,
       and send matrices to the shader program*/
    mat3.normalFromMat4(normalMatrix, modelview);
    gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);
    gl.uniformMatrix4fv(u_modelview, false, modelview );
    gl.uniformMatrix4fv(u_projection, false, projection );  
    gl.drawElements(gl.TRIANGLES, objects[currentModelNumber].indices.length, gl.UNSIGNED_SHORT, 0);
}

//for the point light you can use the angle to determine where to cut off light


/*
 * Called and data for the model are copied into the appropriate buffers, and the
 * scene is drawn.
 */
function installModel(modelData) {
     gl.bindBuffer(gl.ARRAY_BUFFER, a_coords_buffer);
     gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
     gl.vertexAttribPointer(a_coords_loc, 3, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_coords_loc);
     gl.bindBuffer(gl.ARRAY_BUFFER, a_normal_buffer);
     gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
     gl.vertexAttribPointer(a_normal_loc, 3, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_normal_loc);
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index_buffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
}


/* Initialize the WebGL context.  Called from init() */
function initGL() {
    var prog = createProgram(gl,"vshader-source","fshader-source");
    gl.useProgram(prog);
    a_coords_loc =  gl.getAttribLocation(prog, "a_coords");
    a_normal_loc =  gl.getAttribLocation(prog, "a_normal");
    u_modelview = gl.getUniformLocation(prog, "modelview");
    u_projection = gl.getUniformLocation(prog, "projection");
    u_normalMatrix =  gl.getUniformLocation(prog, "normalMatrix");

    u_lightPosition=  gl.getUniformLocation(prog, "lightPosition");
    u_pointLightPosition = gl.getUniformLocation(prog, "pointLightPosition")


    u_diffuseColor =  gl.getUniformLocation(prog, "diffuseColor");
    u_specularColor =  gl.getUniformLocation(prog, "specularColor");
    u_specularExponent = gl.getUniformLocation(prog, "specularExponent");
    a_coords_buffer = gl.createBuffer();
    a_normal_buffer = gl.createBuffer();
    index_buffer = gl.createBuffer();

    gl.enable(gl.DEPTH_TEST);
    gl.uniform3f(u_specularColor, 0.5, 0.5, 0.5);
    gl.uniform4f(u_diffuseColor, .2,.2,.2, 1);
    gl.uniform1f(u_specularExponent, 10);

    gl.uniform4f(u_lightPosition, 0, 0, 0, 1); 
    gl.uniform4f(u_pointLightPosition, 1,0,0,1);
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type String is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 *    The second and third parameters are the id attributes for <script>
 * elementst that contain the source code for the vertex and fragment
 * shaders.
 */
function createProgram(gl, vertexShaderID, fragmentShaderID) {
    function getTextContent( elementID ) {
            // This nested function retrieves the text content of an
            // element on the web page.  It is used here to get the shader
            // source code from the script elements that contain it.
        var element = document.getElementById(elementID);
        var node = element.firstChild;
        var str = "";
        while (node) {
            if (node.nodeType == 3) // this is a text node
                str += node.textContent;
            node = node.nextSibling;
        }
        return str;
    }
    try {
        var vertexShaderSource = getTextContent( vertexShaderID );
        var fragmentShaderSource = getTextContent( fragmentShaderID );
    }
    catch (e) {
        throw "Error: Could not get shader source code from script elements.";
    }
    var vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vertexShaderSource);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
     }
    var fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    var canvas = document.getElementById("myGLCanvas");
    gl = canvas.getContext("webgl");
    initGL();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    console.log("get on girl");

    rotator = new TrackballRotator(canvas, draw, 15);
    tick();
}

function tick() {
    requestAnimFrame(tick);
    draw();

}