export type Program = readonly [
  HTMLCanvasElement, // target canvas
  string, // vertex shader
  string, // fragment shader
  readonly string[], // uniforms
  readonly string[], // attributes
  readonly (readonly [number, ...number[]])[], // buffer attribute values
  readonly (HTMLCanvasElement | HTMLImageElement)[],
];

export type CompiledProgram = readonly [readonly WebGLUniformLocation[], readonly WebGLTexture[]];

export function compileProgram([
  c,
  vertexShaderSource,
  fragmentShaderSource,
  uniforms,
  attributes,
  attributeValues,
  textureData,
]: Program): CompiledProgram {
  const gl = c.getContext('webgl')!;

  const [
    vertexShader,
    fragmentShader,
  ] = [
    fragmentShaderSource,
    vertexShaderSource,
  ].map(function (source, i) {
    const shader = gl.createShader(gl.FRAGMENT_SHADER + i)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      source.split('\n').map(function (line, lineNumber) {
        // eslint-disable-next-line no-console
        console.log(lineNumber + 1, line);
      });
      throw new Error(gl.getShaderInfoLog(shader)!);
    }
    return shader;
  });
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program)!);
  }
  const attributeLocations = attributes.map(function (attribute) {
    return gl.getAttribLocation(program, attribute);
  });
  const uniformLocations = uniforms.map(function (uniform) {
    return gl.getUniformLocation(program, uniform)!;
  });
  // create the geometry (there's only ever one)
  attributeValues.forEach(function (values, i) {
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const [
      numComponents,
      ...data
    ] = values;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(
      attributeLocations[i],
      numComponents,
      type,
      normalize,
      stride,
      offset,
    );
    gl.enableVertexAttribArray(attributeLocations[i]);
  });
  gl.useProgram(program);
  // create the textures
  const textures = textureData.map(function (textureData, i) {
    const texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // TODO make filter configurable (images = nearest, effects = linear)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return texture;
  });
  return [
    uniformLocations,
    textures,
  ];
}
