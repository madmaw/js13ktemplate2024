import {
  IDENTITY,
  multiply,
  scale,
  translate,
} from 'math/mat3';
import { compileProgram } from 'util/webgl';
// import b from '../assets/b.bmp';
import {
  GLSLX_NAME_A_MODEL_POSITION,
  GLSLX_NAME_U_BACKGROUND,
  GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION,
  GLSLX_NAME_U_MODEL_POSITION_TO_TEXTURE_COORD,
  GLSLX_NAME_U_SCREEN_POSITION_TO_BACKGROUND_COORD,
  GLSLX_NAME_U_TEXTURE,
  GLSLX_SOURCE_FRAGMENT,
  GLSLX_SOURCE_VERTEX,
} from './shaders/overlay';

I.onload = function () {
  const square = [
    // stride
    3,
    // 0
    0,
    0,
    1,
    // 1
    1,
    0,
    1,
    // 2
    0,
    1,
    1,
    // 3
    1,
    1,
    1,
  ] as const;
  const canvases = [Z];
  function resize() {
    canvases.map(function (canvas) {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
    });
  }
  onresize = resize;
  resize();
  const programs = [
    [
      Z,
      GLSLX_SOURCE_VERTEX,
      GLSLX_SOURCE_FRAGMENT,
      [
        GLSLX_NAME_U_TEXTURE,
        GLSLX_NAME_U_BACKGROUND,
        GLSLX_NAME_U_MODEL_POSITION_TO_TEXTURE_COORD,
        GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION,
        GLSLX_NAME_U_SCREEN_POSITION_TO_BACKGROUND_COORD,
      ],
      [GLSLX_NAME_A_MODEL_POSITION],
      [square],
      [
        I,
        Z,
      ],
    ],
  ] as const;

  const [
    [
      [
        uniformTexture,
        uniformBackground,
        uniformModelPositionToTextureCoord,
        uniformModelPositionToScreenPosition,
        uniformScreenPositionToBackgroundCoord,
      ],
      [
        imageTexture,
        backgroundTexture,
      ],
    ],
  ] = programs.map(compileProgram);
  const gl = Z.getContext('webgl', {
    preserveDrawingBuffer: true,
  })!;
  gl.clearColor(0, 0, 0, 0.5);

  gl.uniformMatrix3fv(uniformModelPositionToTextureCoord, false, IDENTITY);
  gl.uniformMatrix3fv(uniformScreenPositionToBackgroundCoord, false, IDENTITY);

  // gl.activeTexture(gl.TEXTURE0);
  // gl.bindTexture(gl.TEXTURE_2D, imageTexture);
  gl.uniform1i(uniformTexture, 0);

  // gl.activeTexture(gl.TEXTURE1);
  // gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
  gl.uniform1i(uniformBackground, 1);

  setInterval(function () {
    const m = multiply(
      translate(-Math.random(), 1 - Math.random()),
      scale(1, -1),
    );
    // console.log(m, transformMat3([0, 0], m));
    gl.uniformMatrix3fv(
      uniformModelPositionToScreenPosition,
      false,
      m,
    );

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, 1000);
};
I.src = 'b.bmp';
