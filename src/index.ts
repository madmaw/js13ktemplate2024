import {
  IDENTITY,
  multiply,
  scale,
  translate,
} from 'math/mat3';
import {
  compileStep,
  createTextures,
  type StepDefinition,
  type TextureDef,
} from 'util/webgl';
// import b from '../assets/b.bmp';
import { normalize } from 'math/vec';
import {
  GLSLX_NAME_A_MODEL_POSITION as CRT_A_MODEL_POSITION,
  GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION as CRT_U_MODEL_POSITION_TO_SCREEN_POSITION,
  GLSLX_NAME_U_SCANLINE_COLOR as CRT_U_SCANLINE_COLOR,
  GLSLX_NAME_U_SCREEN_POSITION_TO_SCANLINE as CRT_U_SCREEN_POSITION_TO_SCANLINE,
  GLSLX_NAME_U_TEXTURE as CRT_U_TEXTURE,
  GLSLX_SOURCE_FRAGMENT as CRT_SOURCE_FRAGMENT,
  GLSLX_SOURCE_VERTEX as CRT_SOURCE_VERTEX,
} from './shaders/crt';
import {
  GLSLX_NAME_A_MODEL_POSITION as OVERLAY_A_MODEL_POSITION,
  GLSLX_NAME_U_BACKGROUND as OVERLAY_U_BACKGROUND,
  GLSLX_NAME_U_LIGHT_NORMAL as OVERLAY_U_LIGHT_NORMAL,
  GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION as OVERLAY_U_MODEL_POSITION_TO_SCREEN_POSITION,
  GLSLX_NAME_U_MODEL_POSITION_TO_TEXTURE_COORD as OVERLAY_U_MODEL_POSITION_TO_TEXTURE_COORD,
  GLSLX_NAME_U_PALETTE as OVERLAY_U_PALETTE,
  GLSLX_NAME_U_SCREEN_POSITION_TO_BACKGROUND_COORD as OVERLAY_U_SCREEN_POSITION_TO_BACKGROUND_COORD,
  GLSLX_NAME_U_TEXTURE as OVERLAY_U_TEXTURE,
  GLSLX_SOURCE_FRAGMENT as OVERLAY_SOURCE_FRAGMENT,
  GLSLX_SOURCE_VERTEX as OVERLAY_SOURCE_VERTEX,
} from './shaders/overlay';

const WIDTH = 256;
const HEIGHT = 256;

I.onload = function () {
  const square = [
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

  const TEXTURE_INDEX_PINGPONG_1 = 0;
  const TEXTURE_INDEX_PINGPONG_2 = 1;
  const TEXTURE_INDEX_OVERLAY_COPY = 2;
  const TEXTURE_INDEX_SPRITE_SHEET = 3;
  const TEXTURE_INDEX_TRANSPARENT = 4;
  const TEXTURE_DEFS: TextureDef[] = [
    // 0
    {
      empty: 1,
      width: WIDTH,
      height: HEIGHT,
    },
    // 1
    {
      empty: 1,
      width: WIDTH,
      height: HEIGHT,
    },
    // 2
    {
      empty: 1,
      width: WIDTH,
      height: HEIGHT,
    },
    // 3
    I,
    // 4
    transparent,
  ];
  const gl = Z.getContext('webgl', {
    preserveDrawingBuffer: true,
  })!;

  let textures: WebGLTexture[] = [];
  let framebuffers: WebGLFramebuffer[] = [];
  function setOutput(textureIndex: number) {
    gl.activeTexture(gl.TEXTURE0 + textureIndex);
    gl.bindTexture(gl.TEXTURE_2D, textures[textureIndex]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[textureIndex]);
  }

  function resize() {
    textures.map(function (texture) {
      gl.deleteTexture(texture);
    });
    framebuffers.map(function (framebuffer) {
      gl.deleteFramebuffer(framebuffer);
    });
    textures = createTextures(gl, TEXTURE_DEFS);
    framebuffers = textures.slice(0, TEXTURE_INDEX_SPRITE_SHEET).map(
      function (texture) {
        const fb = gl.createFramebuffer()!;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        return fb;
      },
    );
  }
  onresize = resize;
  resize();

  const programs: StepDefinition[] = [
    //
    // overlay
    //
    [
      OVERLAY_SOURCE_VERTEX,
      OVERLAY_SOURCE_FRAGMENT,
      [
        OVERLAY_U_TEXTURE,
        OVERLAY_U_BACKGROUND,
        OVERLAY_U_MODEL_POSITION_TO_TEXTURE_COORD,
        OVERLAY_U_MODEL_POSITION_TO_SCREEN_POSITION,
        OVERLAY_U_SCREEN_POSITION_TO_BACKGROUND_COORD,
        OVERLAY_U_PALETTE,
        OVERLAY_U_LIGHT_NORMAL,
      ],
      [
        [
          OVERLAY_A_MODEL_POSITION,
          square,
        ],
      ],
      function (
        [
          [
            overlayUniformTexture,
            overlayUniformBackground,
            overlayUniformModelPositionToTextureCoord,
            overlayUniformModelPositionToScreenPosition,
            overlayUniformScreenPositionToBackgroundCoord,
            overlayUniformPalette,
            overlayUniformLightNormal,
          ],
        ],
        inputTextureIndex,
        outputTextureIndex,
      ) {
        gl.uniformMatrix3fv(overlayUniformModelPositionToTextureCoord, false, IDENTITY);
        gl.uniformMatrix3fv(overlayUniformScreenPositionToBackgroundCoord, false, multiply(
          scale(.5, .5),
          translate(1, 1),
        ));
        gl.uniform4fv(overlayUniformPalette, [
          // 0 transparent
          .5,
          .5,
          .5,
          0,
          // 1 yellow
          .6,
          .6,
          0,
          1,
          // 2 dark
          .2,
          .2,
          .2,
          1,
          // 3 metal
          .2,
          .4,
          .8,
          1,
        ]);

        gl.uniform3fv(
          overlayUniformLightNormal,
          normalize([
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
          ]),
        );
        // clear the copy (may not be necessary)
        setOutput(TEXTURE_INDEX_OVERLAY_COPY);
        gl.clear(gl.COLOR_BUFFER_BIT);

        for (let i = 0; i < 3; i++) {
          const m = multiply(
            translate(
              -Math.round(Math.random() * WIDTH) / WIDTH,
              1 - Math.round(Math.random() * HEIGHT) / HEIGHT,
            ),
            scale(1, -1),
          );
          gl.uniformMatrix3fv(
            overlayUniformModelPositionToScreenPosition,
            false,
            m,
          );

          // update the target
          setOutput(outputTextureIndex);

          gl.uniform1i(overlayUniformTexture, TEXTURE_INDEX_SPRITE_SHEET);
          gl.uniform1i(overlayUniformBackground, TEXTURE_INDEX_OVERLAY_COPY);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

          // update the copy
          setOutput(TEXTURE_INDEX_OVERLAY_COPY);

          gl.uniform1i(overlayUniformTexture, TEXTURE_INDEX_TRANSPARENT);
          gl.uniform1i(overlayUniformBackground, outputTextureIndex);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      },
      [
        WIDTH,
        HEIGHT,
      ],
    ],
    //
    // CRT
    //
    [
      CRT_SOURCE_VERTEX,
      CRT_SOURCE_FRAGMENT,
      [
        CRT_U_TEXTURE,
        CRT_U_SCANLINE_COLOR,
        CRT_U_MODEL_POSITION_TO_SCREEN_POSITION,
        CRT_U_SCREEN_POSITION_TO_SCANLINE,
      ],
      [
        [
          CRT_A_MODEL_POSITION,
          square,
        ],
      ],
      function ([
        [
          _crtUniformTexture,
          crtUniformScanlineColor,
          crtUniformModelPositionToScreenPosition,
          crtUniformPositionToScanline,
        ],
      ]) {
        gl.uniform4f(crtUniformScanlineColor, 0, 0, 0, .2);
        gl.uniformMatrix3fv(
          crtUniformPositionToScanline,
          false,
          scale(1, HEIGHT / 4),
        );
        gl.uniformMatrix3fv(
          crtUniformModelPositionToScreenPosition,
          false,
          multiply(translate(-1, -1), scale(2, 2)),
        );
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    ],
  ] as const;

  const pipeline = programs.map(function (program) {
    return compileStep(gl, program);
  });

  gl.clearColor(0, 0, 0, 0);

  let count = 0;

  function update() {
    pipeline.reduce(function (inputTextureIndex, step, i) {
      const outputTextureIndex = (inputTextureIndex - TEXTURE_INDEX_PINGPONG_1 + 1) % 2 + TEXTURE_INDEX_PINGPONG_1;
      if (i == pipeline.length - 1) {
        // render to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        setOutput(outputTextureIndex);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      step(inputTextureIndex, outputTextureIndex);
      return outputTextureIndex;
    }, TEXTURE_INDEX_PINGPONG_1);
    count++;
    setTimeout(update, 1000 * count);
  }

  update();
};
I.src = 'c.png';
