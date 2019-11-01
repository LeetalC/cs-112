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
var u_lightPosition;
var u_modelview;
var u_projection;
var u_normalMatrix;    

var projection = mat4.create();          // projection matrix
var modelview;                           // modelview matrix; value comes from rotator
var normalMatrix = mat3.create();        // matrix, derived from model and view matrix, for transforming normal vectors
var rotator;                             // A TrackballRotator to implement rotation by mouse.
//make scale matrix, transform matrix
var lastTime = 0;
var colors = [  // RGB color arrays for diffuse and specular color values
    [1,1,1],
];

var lightPositions = [  // values for light position
  [0,0,0,1],
];

var objects = [         // Objects for display
    chair(),table(), cube(),
];

var currentModelNumber;  // contains data for the current object

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

    if (document.getElementById("my_gl").checked)
    {
       mat4.multiply(modelview, modelview, transMat);
    }
    else {
        mat4.translate(modelview, modelview, vec);
    }  
    return modelview;
}

function rotate(modelview, a, axis)
    {   
        var xMat = [1, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1];
        var yMat = [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1];
        var zMat = [Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    if (document.getElementById("my_gl").checked) {
        if(axis == "X") mat4.multiply(modelview,modelview,xMat);
        if(axis == "Y") mat4.multiply(modelview,modelview,yMat);
        if(axis == "Z") mat4.multiply(modelview,modelview,zMat);

    }
    else {
        if(axis == "X") mat4.rotateX(modelview,modelview,a);
        if(axis == "Y") mat4.rotateY(modelview,modelview,a);
        if(axis == "Z") mat4.rotateZ(modelview,modelview,a);
    }  
    return modelview;

}


function scale(modelview, vec)
{
    var scaleMat = [vec[0], 0, 0, 0, 0, vec[1], 0, 0, 0, 0, vec[2], 0, 0,0,0,1];
    if (document.getElementById("my_gl").checked) {
        mat4.multiply(modelview, modelview, scaleMat);
    }
    else {
        mat4.scale(modelview, modelview, vec);
    }
    return modelview;
}

function draw() {
    gl.clearColor(0.50, 0.85, 0.95,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //perspective(projection, Math.PI/10, 1, 10, 20);
    mat4.perspective(projection,Math.PI/10, 1, 10, 20 );
    modelview = rotator.getViewMatrix();

    // draw the 1st chair , object[0]
    installModel(objects[0]);
    currentModelNumber = 0;
    translate(modelview,[1.2, -0.6, -0.1]);
    rotate(modelview,degToRad(45),"Y");
    update_uniform(modelview,projection, 0);
    modelview = rotator.getViewMatrix();

    // draw the 2nd chair , object[0]
    installModel(objects[0]);
    currentModelNumber = 0;
    translate(modelview,[0.3, -0.6, 1.2]);
    rotate(modelview,degToRad(-45),"Y");
    update_uniform(modelview,projection, 0);
    modelview = rotator.getViewMatrix();

    // draw the 3rd chair , object[0]
    installModel(objects[0]);
    currentModelNumber = 0;
    translate(modelview,[-1,-0.6, 0.4])
    rotate(modelview, 180, "Y");
    update_uniform(modelview,projection, 0);
    modelview = rotator.getViewMatrix();

    // draw the 4th chair , object[0]
    installModel(objects[0]);
    currentModelNumber = 0;
    translate(modelview,[-.2,-0.6, -1])
    rotate(modelview, 279, "Y");
    update_uniform(modelview,projection, 0);
    modelview = rotator.getViewMatrix();

    // draw the Table , object[1]
    installModel(objects[1]);
    currentModelNumber = 1;
    update_uniform(modelview,projection, 1);
    modelview = rotator.getViewMatrix();

    // draw the Cube , object[2]
    installModel(objects[2]);
    currentModelNumber = 2;
    scale(modelview,[.3,.3,.3]);
    translate(modelview, [-.2, .4,-.3]);
    update_uniform(modelview,projection, 2);

   
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
    try {
        var canvas = document.getElementById("myGLCanvas");
        gl = canvas.getContext("webgl") ||
                         canvas.getContext("experimental-webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context:" + e + "</p>";
        return;
    }

    document.getElementById("my_gl").checked = true;
    document.getElementById("my_gl").onchange = draw;
    rotator = new TrackballRotator(canvas, draw, 15);
    draw();
}