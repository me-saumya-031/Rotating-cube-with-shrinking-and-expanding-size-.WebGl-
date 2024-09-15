window.onload = function() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    canvas.width = 600;
    canvas.height = 600;

    // Set the viewport to match the canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);

    const vertexShaderSource = `
        attribute vec4 a_position;
        attribute vec4 a_color;
        varying vec4 v_color;
        uniform mat4 u_modelViewProjectionMatrix;
        void main() {
            gl_Position = u_modelViewProjectionMatrix * a_position;
            v_color = a_color;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        varying vec4 v_color;
        void main() {
            gl_FragColor = v_color;
        }
    `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    const vertices = new Float32Array([
        // Position        // Color
        -1, -1, -1,    1, 0, 0, 1,  // Red
         1, -1, -1,    1, 0, 0, 1,  // Red
         1,  1, -1,    1, 0, 0, 1,  // Red
        -1,  1, -1,    1, 0, 0, 1,  // Red

        -1, -1,  1,    0, 1, 0, 1,  // Green
         1, -1,  1,    0, 1, 0, 1,  // Green
         1,  1,  1,    0, 1, 0, 1,  // Green
        -1,  1,  1,    0, 1, 0, 1,  // Green

        -1, -1, -1,    1, 1, 0, 1,  // Yellow
        -1, -1,  1,    1, 1, 0, 1,  // Yellow
        -1,  1,  1,    1, 1, 0, 1,  // Yellow
        -1,  1, -1,    1, 1, 0, 1,  // Yellow

         1, -1, -1,    0, 0, 1, 1,  // Blue
         1, -1,  1,    0, 0, 1, 1,  // Blue
         1,  1,  1,    0, 0, 1, 1,  // Blue
         1,  1, -1,    0, 0, 1, 1,  // Blue

        -1, -1, -1,    1, 0, 1, 1,  // Magenta
         1, -1, -1,    1, 0, 1, 1,  // Magenta
         1, -1,  1,    1, 0, 1, 1,  // Magenta
        -1, -1,  1,    1, 0, 1, 1,  // Magenta

        -1,  1, -1,    0, 1, 1, 1,  // Cyan
         1,  1, -1,    0, 1, 1, 1,  // Cyan
         1,  1,  1,    0, 1, 1, 1,  // Cyan
        -1,  1,  1,    0, 1, 1, 1,  // Cyan
    ]);

    const indices = new Uint16Array([
        0, 1, 2,  2, 3, 0, // Front face
        4, 5, 6,  6, 7, 4, // Back face
        8, 9, 10, 10, 11, 8, // Left face
        12, 13, 14, 14, 15, 12, // Right face
        16, 17, 18, 18, 19, 16, // Bottom face
        20, 21, 22, 22, 23, 20 // Top face
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getAttribLocation(program, 'a_color');
    const modelViewProjectionMatrixLocation = gl.getUniformLocation(program, 'u_modelViewProjectionMatrix');

    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(colorLocation);

    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

    const projectionMatrix = mat4.create();
    const modelViewMatrix = mat4.create();
    const modelViewProjectionMatrix = mat4.create();
    
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);

    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -8]); 
    mat4.rotateX(modelViewMatrix, modelViewMatrix, Math.PI / 6); 
    mat4.rotateY(modelViewMatrix, modelViewMatrix, Math.PI / 4); 

    let scaleFactor = 1.5; // Initial scale factor
    let angle = 0;

    function render() {
        angle += 0.01; // Increment angle

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        const modelViewMatrixCopy = mat4.clone(modelViewMatrix);
        mat4.rotateY(modelViewMatrixCopy, modelViewMatrixCopy, angle); // Rotate around Y-axis
        mat4.scale(modelViewMatrixCopy, modelViewMatrixCopy, [scaleFactor, scaleFactor, scaleFactor]); // Apply dynamic scaling

        mat4.multiply(modelViewProjectionMatrix, projectionMatrix, modelViewMatrixCopy);
        gl.uniformMatrix4fv(modelViewProjectionMatrixLocation, false, modelViewProjectionMatrix);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(render);
    }

    // Handle keyboard input to adjust scale
    window.addEventListener('keydown', (event) => {
        if (event.key === 'a' || event.key === 'A') {
            scaleFactor += 0.1; // Expand when "A" is pressed
        } else if (event.key === 'd' || event.key === 'D') {
            scaleFactor = Math.max(0.1, scaleFactor - 0.1); // Shrink when "D" is pressed (but not below 0.1)
        }
    });

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1); // Set clear color to black
    render();
};

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}
