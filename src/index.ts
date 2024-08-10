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

const WIDTH = 256;
const HEIGHT = 256;

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
  const transparent = document.createElement('canvas');
  transparent.width = 1;
  transparent.height = 1;
  const canvases = [Z];
  function resize() {
    canvases.map(function (canvas) {
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
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
        0,
        0,
        I,
        transparent,
      ],
    ],
  ] as const;

  const zCopyIndex = 0;
  const zPreviousCopyIndex = 1;
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
        zCopyTexture,
        zPreviousCopyTexture,
        // imageTexture,
        // transparentTexture
      ],
    ],
  ] = programs.map(compileProgram);
  const gl = Z.getContext('webgl')!;

  gl.uniformMatrix3fv(uniformModelPositionToTextureCoord, false, IDENTITY);
  gl.uniformMatrix3fv(uniformScreenPositionToBackgroundCoord, false, multiply(
    scale(.5, .5),
    translate(1, 1),
  ));

  const [
    zCopyFramebuffer,
    zPreviousCopyFramebuffer,
  ] = [
    zCopyTexture,
    zPreviousCopyTexture,
  ].map(function (backgroundTexture) {
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      backgroundTexture,
      0,
    );
    return fb;
  });

  gl.viewport(0, 0, Z.width, Z.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

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

    // update the copy
    gl.activeTexture(gl.TEXTURE0 + zCopyIndex);
    gl.bindTexture(gl.TEXTURE_2D, zCopyTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, zCopyFramebuffer);

    gl.uniform1i(uniformTexture, 2);
    gl.uniform1i(uniformBackground, zPreviousCopyIndex);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // render to the screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // update the previous copy
    gl.activeTexture(gl.TEXTURE0 + zPreviousCopyIndex);
    gl.bindTexture(gl.TEXTURE_2D, zPreviousCopyTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, zPreviousCopyFramebuffer);

    gl.uniform1i(uniformTexture, 3);
    gl.uniform1i(uniformBackground, zCopyIndex);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, 1000);
};
I.src = 'c.png';
