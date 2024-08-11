import { type Truthy } from 'types';

export type Program = readonly [
  string, // vertex shader
  string, // fragment shader
  readonly string[], // uniforms
  readonly (readonly [string, readonly number[]])[], // buffer attribute values
];

export type CompiledProgram = readonly [
  WebGLProgram,
  readonly WebGLUniformLocation[],
  readonly (readonly [number, WebGLBuffer])[],
];

export function compileProgram(
  gl: WebGLRenderingContext,
  [
    vertexShaderSource,
    fragmentShaderSource,
    uniforms,
    attributeValues,
  ]: Program,
): CompiledProgram {
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
  const uniformLocations = uniforms.map(function (uniform) {
    return gl.getUniformLocation(program, uniform)!;
  });
  // create the geometry (there's only ever one)
  const buffers = attributeValues.map(function ([
    attribute,
    values,
  ]) {
    const attributeLocation = gl.getAttribLocation(program, attribute);
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
    return [
      attributeLocation,
      buffer,
    ] as const;
  });
  gl.useProgram(program);
  const compiledProgram: CompiledProgram = [
    program,
    uniformLocations,
    buffers,
  ];
  return compiledProgram;
}

export type TextureDef =
  | HTMLImageElement & { empty?: undefined }
  | HTMLCanvasElement & { empty?: undefined }
  | {
    width?: number,
    height?: number,
    empty: Truthy,
  };

export function createTextures(gl: WebGLRenderingContext, textureDefs: TextureDef[]) {
  return textureDefs.map(function (textureDef, i) {
    const texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (textureDef.empty) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        textureDef.width || innerWidth,
        textureDef.height || innerHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        textureDef as TexImageSource,
      );
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const p = textureDef.empty ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, p);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, p);
    return texture;
  });
}
