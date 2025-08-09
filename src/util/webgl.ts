import type { Truthy } from "types";

export type StepRenderer<GameState> = (
  gameState: GameState,
  inputTextureIndex: number,
  outputTextureIndex: number,
) => void;

export type CompiledStepRenderer<GameState> = (
  step: CompiledStep,
  gameState: GameState,
  outputTextureIndex: number,
) => void;

export type StepDefinition<GameState> = readonly [
  string, // vertex shader
  string, // fragment shader
  readonly string[], // uniforms (first one has to be the input texture)
  readonly (readonly [string, readonly number[]])[], // buffer attribute values
  CompiledStepRenderer<GameState>,
];

export type CompiledStep = readonly WebGLUniformLocation[];

export function compileStep<GameState>(
  gl: WebGLRenderingContext,
  [
    vertexShaderSource,
    fragmentShaderSource,
    uniforms,
    attributeValues,
    renderer,
  ]: StepDefinition<GameState>,
): StepRenderer<GameState> {
  const [vertexShader, fragmentShader] = [
    fragmentShaderSource,
    vertexShaderSource,
  ].map((source, i) => {
    const shader = gl.createShader(gl.FRAGMENT_SHADER + i)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      source.split("\n").map((line, lineNumber) => {
        console.error(lineNumber + 1, line);
      });
      throw new Error(gl.getShaderInfoLog(shader)!);
    }
    return shader;
  });
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program)!);
  }
  const uniformLocations = uniforms.map(
    (uniform) => gl.getUniformLocation(program, uniform)!,
  );
  // create the geometry (there's only ever one)
  const buffers = attributeValues.map(([attribute, values]) => {
    const attributeLocation = gl.getAttribLocation(program, attribute);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
    return [attributeLocation, buffer] as const;
  });
  gl.useProgram(program);
  const compiledStep: CompiledStep = uniformLocations;
  return (
    gameState: GameState,
    inputTextureIndex: number,
    outputTextureIndex: number,
  ) => {
    gl.useProgram(program);
    gl.uniform1i(uniformLocations[0], inputTextureIndex);
    buffers.map(([attribute, buffer]) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(attribute);
    });

    renderer(compiledStep, gameState, outputTextureIndex);
  };
}

export type TextureDef =
  | (HTMLImageElement & { empty?: undefined })
  | (HTMLCanvasElement & { empty?: undefined })
  | {
      width?: number;
      height?: number;
      empty: Truthy;
    };

export function createTextures(
  gl: WebGLRenderingContext,
  textureDefs: TextureDef[],
) {
  return textureDefs.map((textureDef, i) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if (textureDef.empty) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        textureDef.width ?? innerWidth,
        textureDef.height ?? innerHeight,
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

        textureDef as TexImageSource,
      );
    }
    // anything non-power of two must be CLAMP_TO_EDGE, assume any resources are po2
    const r = textureDef.empty ? gl.CLAMP_TO_EDGE : gl.REPEAT;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, r);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, r);
    const p = textureDef.empty ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, p);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, p);
    return texture;
  });
}
