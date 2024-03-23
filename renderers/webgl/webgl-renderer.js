import {
	createProgram,
	createShader,
} from './utils.js';
import { randomInt } from '../../utils/random.js';

export class WebglRenderer {
	state = null;
	containerElement = null;
	unobserveCamera = null;
	unobserveScreenSize = null;
	ctx = null;
	animationFrame = null;

	constructor(state, containerElement) {
		this.state = state;
		this.containerElement = containerElement;

		// Why the fuck is this needed...
		setTimeout(this.setup.bind(this), 100);
	}

	setup() {
		this.destroy();

		const { screenSize } = this.state;

		this.unobserveCamera = this.state.observe(
			'camera.offset',
			this.updateCamera.bind(this),
		);

		this.unobserveScreenSize = this.state.observe(
			'screenSize',
			this.updateScreenSize.bind(this),
		);

		const canvas = document.createElement('canvas');
		this.containerElement.appendChild(canvas);
		canvas.width = screenSize.width;
		canvas.height = screenSize.height;
		canvas.style.width = '100%';
		canvas.style.height = '100%';
		canvas.style.imageRendering = 'pixelated';

		this.ctx = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
		});

		this.setupWebGL();
		this.updateScreenSize();
		this.updateCamera();

		this.loop();
	}

	setupWebGL() {
		const gl = this.ctx;

		// language=Glsl
		const vertexShaderSource = `
			#version 300 es

			in vec2 position;
			
			uniform vec2 resolution;

			void main() {
					vec2 clipSpace = ((position / resolution) * 2.0) - 1.0;
					gl_Position = vec4(clipSpace * vec2(1, -1), 0.0, 1.0);
			}
		`;

		// language=Glsl
		const fragmentShaderSource = `
			#version 300 es
			
			precision highp float;
			
			uniform vec4 color;
			
			out vec4 outColor;
			
			void main() {
          outColor = color;
			}
		`;

		const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

		const program = createProgram(gl, vertexShader, fragmentShader);

		const positionAttributeLocation = gl.getAttribLocation(program, 'position');
		const resolutionUniformLocation = gl.getUniformLocation(program, 'resolution');
		this.colorLocation = gl.getUniformLocation(program, 'color');

		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		const positions = new Float32Array([
			10, 20,
			80, 20,
			10, 30,
		]);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

		const vertexArray = gl.createVertexArray();
		gl.bindVertexArray(vertexArray);
		gl.enableVertexAttribArray(positionAttributeLocation);
		const vertexSize = 2;
		const type = gl.FLOAT;
		const normalize = false;
		const vertexStride = 0;
		const vertexOffset = 0;
		gl.vertexAttribPointer(
			positionAttributeLocation,
			vertexSize,
			type,
			normalize,
			vertexStride,
			vertexOffset,
		);

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.useProgram(program);
		gl.bindVertexArray(vertexArray);

		gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
	}

	loop() {
		this.draw();
		this.animationFrame = requestAnimationFrame(this.loop.bind(this));
	}

	draw() {
		const gl = this.ctx;

		const positions = new Float32Array([
			randomInt(0, gl.canvas.width), randomInt(0, gl.canvas.height),
			randomInt(0, gl.canvas.width), randomInt(0, gl.canvas.height),
			randomInt(0, gl.canvas.width), randomInt(0, gl.canvas.height),
		]);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		gl.uniform4f(this.colorLocation, Math.random(), Math.random(), Math.random(), 1);

		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}

	updateCamera() {

	}

	updateScreenSize() {
		const { width, height } = this.state.screenSize;
		const gl = this.ctx;

		gl.canvas.width = width;
		gl.canvas.height = height;
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}

	destroy() {
		this.containerElement?.replaceChildren();
		this.unobserveCamera?.();
		this.unobserveScreenSize?.();
		cancelAnimationFrame(this.animationFrame);
	}
}
