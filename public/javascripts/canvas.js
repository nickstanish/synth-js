
var GL;

var horizAspect = 480.0/640.0;
var squareVerticesBuffer, squareVerticesColorBuffer;
var mvMatrix;
var shaderProgram;
var vertexPositionAttribute, vertexColorAttribute;
var perspectiveMatrix;
var squareRotation = 0.0;
var lastSquareUpdateTime;

var shaderConf = [{
  type: "x-shader/x-fragment",
  src: "/javascripts/shader-f.js",
  content: ""
}, {
  type: "x-shader/x-vertex",
  src: "/javascripts/shader-v.js",
  content: ""
}];


//
// Matrix utility functions
//

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = GL.getUniformLocation(shaderProgram, "uPMatrix");
  GL.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

  var mvUniform = GL.getUniformLocation(shaderProgram, "uMVMatrix");
  GL.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  } else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (!mvMatrixStack.length) {
    throw("Can't pop from an empty matrix stack.");
  }
  
  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function mvRotate(angle, v) {
  var inRadians = angle * Math.PI / 180.0;
  
  var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
  multMatrix(m);
}


function initBuffers() {
  squareVerticesBuffer = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, squareVerticesBuffer);
  
  var vertices = [
    1.0,  1.0,  0.0,
    -1.0, 1.0,  0.0,
    1.0,  -1.0, 0.0,
    -1.0, -1.0, 0.0
  ];


  
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(vertices), GL.STATIC_DRAW);

  var colors = [
    1.0,  1.0,  1.0,  1.0,    // white
    1.0,  0.0,  0.0,  1.0,    // red
    0.0,  1.0,  0.0,  1.0,    // green
    0.0,  0.0,  1.0,  1.0     // blue
  ];
  
  squareVerticesColorBuffer = GL.createBuffer();
  GL.bindBuffer(GL.ARRAY_BUFFER, squareVerticesColorBuffer);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(colors), GL.STATIC_DRAW);
}


function getShader(GL, source, type) {
  var shader;
  
 
  if (type == "x-shader/x-fragment") {
    shader = GL.createShader(GL.FRAGMENT_SHADER);
  } else if (type == "x-shader/x-vertex") {
    shader = GL.createShader(GL.VERTEX_SHADER);
  } else {
     // Unknown shader type
     return null;
  }
  GL.shaderSource(shader, source);
    
  // Compile the shader program
  GL.compileShader(shader);  
    
  // See if it compiled successfully
  if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {  
      alert("An error occurred compiling the shaders: " + GL.getShaderInfoLog(shader));  
      return null;  
  }
    
  return shader;
}

function initWebGL(canvas) {
  GL = null;
  
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    GL = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  }
  catch(e) {}
  
  // If we don't have a GL context, give up now
  if (!GL) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    GL = null;
  }
  
  return GL;
}
function initShaders() {
  var $req1 = $.ajax({
    url: shaderConf[0].src,
    async: false,
    dataType: shaderConf[0].type,
    type: 'GET'
  });
  var $req2 = $.ajax({
    url: shaderConf[1].src,
    async: false,
    dataType: shaderConf[1].type,
    type: 'GET'
  });
  shaderConf[0].content = $req1.responseText;
  shaderConf[1].content = $req2.responseText;

  var fragmentShader = getShader(GL, shaderConf[0].content, shaderConf[0].type);
  var vertexShader = getShader(GL, shaderConf[1].content, shaderConf[1].type);
  
  // Create the shader program
  
  shaderProgram = GL.createProgram();
  GL.attachShader(shaderProgram, vertexShader);
  GL.attachShader(shaderProgram, fragmentShader);
  GL.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  
  if (!GL.getProgramParameter(shaderProgram, GL.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  GL.useProgram(shaderProgram);
  
  vertexPositionAttribute = GL.getAttribLocation(shaderProgram, "aVertexPosition");
  vertexColorAttribute = GL.getAttribLocation(shaderProgram, "aVertexColor");
  GL.enableVertexAttribArray(vertexColorAttribute);
  GL.enableVertexAttribArray(vertexPositionAttribute);
}

function drawScene() {
  GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
  
  perspectiveMatrix = makePerspective(45, 640.0/480.0, 0.1, 100.0);
  
  loadIdentity();
  mvTranslate([-0.0, 0.0, -6.0]);
  
  GL.bindBuffer(GL.ARRAY_BUFFER, squareVerticesBuffer);
  GL.vertexAttribPointer(vertexPositionAttribute, 3, GL.FLOAT, false, 0, 0);
  GL.bindBuffer(GL.ARRAY_BUFFER, squareVerticesColorBuffer);
  GL.vertexAttribPointer(vertexColorAttribute, 4, GL.FLOAT, false, 0, 0);
  
  mvPushMatrix();
  mvRotate(squareRotation, [1, 0, 1]);

  setMatrixUniforms();
  GL.drawArrays(GL.TRIANGLE_STRIP, 0, 4);

 
  mvPopMatrix();

  var currentTime = Date.now();
  if (lastSquareUpdateTime) {
    var delta = currentTime - lastSquareUpdateTime;
    
    squareRotation += (30 * delta) / 1000.0;
  }
  
  lastSquareUpdateTime = currentTime;
}


function onReady() {
  console.log("ready");
  var canvas = document.getElementById("canvas");

  GL = initWebGL(canvas);      // Initialize the GL context
  
  // Only continue if WebGL is available and working
  
  if (GL) {
    GL.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
    GL.enable(GL.DEPTH_TEST);                               // Enable depth testing
    GL.depthFunc(GL.LEQUAL);                                // Near things obscure far things
    GL.clear(GL.COLOR_BUFFER_BIT|GL.DEPTH_BUFFER_BIT);      // Clear the color as well as the depth buffer.
    

    initShaders();
    initBuffers();
    setInterval(drawScene, 15);

  }

}

$(document).on("ready", onReady);