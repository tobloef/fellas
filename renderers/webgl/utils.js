export function createShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source.trim());
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Could not compile WebGL shader. \n\n${info}`);
	}

	return shader;
}

export function createProgram(gl, vertexShader, fragmentShader) {
	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const info = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error(`Could not link WebGL program. \n\n${info}`);
	}

	return program;
}
