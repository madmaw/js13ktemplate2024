import {
  IDENTITY,
  multiply,
  scale,
  translate,
} from 'math/mat3';
import {
  compileProgram,
  createTextures,
  type Program,
  type TextureDef,
} from 'util/webgl';
// import b from '../assets/b.bmp';
import { normalize } from 'math/vec';
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

  const TEXTURE_INDEX_FIXED_1 = 0;
  const TEXTURE_INDEX_FIXED_2 = 1;
  const TEXTURE_INDEX_FILL_1 = 2;
  const TEXTURE_INDEX_FILL_2 = 3;
  const TEXTURE_INDEX_SPRITE_SHEET = 4;
  const TEXTURE_INDEX_TRANSPARENT = 5;
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
    },
    // 3
    {
      empty: 1,
    },
    // 4
    I,
    // 5
    transparent,
  ];
  const gl = Z.getContext('webgl', {
    preserveDrawingBuffer: true,
  })!;

  let textures: WebGLTexture[] = [];
  let framebuffers: WebGLFramebuffer[] = [];
  function resize() {
    Z.width = WIDTH;
    Z.height = HEIGHT;
    gl.viewport(0, 0, Z.width, Z.height);
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

  const programs: Program[] = [
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
      [[
        OVERLAY_A_MODEL_POSITION,
        square,
      ]],
    ],
    // [
    //   CRT_SOURCE_VERTEX,
    //   CRT_SOURCE_FRAGMENT,
    //   [
    //     CRT_U_TEXTURE,
    //     CRT_U_MODEL_POSITION_TO_SCREEN_POSITION,
    //   ],
    //   [[CRT_A_MODEL_POSITION, square]],
    //   // [overlayCanvas], // will this work?
    //   // function (
    //   //   gl: WebGLRenderingContext,
    //   //   [
    //   //     crtProgram,
    //   //     [
    //   //       crtUniformTexture,
    //   //       crtUniformModelPositionToScreenPosition,
    //   //     ],
    //   //   ]: CompiledProgram,
    //   // ) {
    //   //   gl.uniform1i(crtUniformTexture, 0);
    //   //   gl.uniformMatrix3fv(
    //   //     crtUniformModelPositionToScreenPosition,
    //   //     false,
    //   //     multiply(translate(-1, -1), scale(2, 2)),
    //   //   );
    //   // },
    // ],
  ] as const;

  const [
    [
      overlayProgram,
      [
        overlayUniformTexture,
        overlayUniformBackground,
        overlayUniformModelPositionToTextureCoord,
        overlayUniformModelPositionToScreenPosition,
        overlayUniformScreenPositionToBackgroundCoord,
        overlayUniformPalette,
        overlayUniformLightNormal,
      ],
      overlayGeometry,
      // [
      //   overlayCopyTexture,
      //   overlayPreviousCopyTexture,
      //   // image texture,
      //   // pixelated image texture
      //   // transparent texture
      // ],
    ],
    // [
    //   crtProgram,
    //   [
    //     crtUniformTexture,
    //     crtUniformModelPositionToScreenPosition,
    //   ],
    //   crtGeometry,
    //   // [
    //   //   crtTexture,
    //   // ],
    // ],
  ] = programs.map(function (program) {
    return compileProgram(gl, program);
  });

  gl.useProgram(overlayProgram);

  gl.clearColor(0, 0, 0, 1);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.clear(gl.COLOR_BUFFER_BIT);

  let count = 0;

  function update() {
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

    gl.uniform3fv(
      overlayUniformLightNormal,
      normalize([
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ]),
    );

    overlayGeometry.map(function ([
      attribute,
      buffer,
    ]) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(
        attribute,
        3,
        gl.FLOAT,
        false,
        0,
        0,
      );
      gl.enableVertexAttribArray(attribute);
    });

    // update the copy
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX_FIXED_1);
    gl.bindTexture(gl.TEXTURE_2D, textures[TEXTURE_INDEX_FIXED_1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[TEXTURE_INDEX_FIXED_1]);

    gl.uniform1i(overlayUniformTexture, TEXTURE_INDEX_SPRITE_SHEET);
    gl.uniform1i(overlayUniformBackground, TEXTURE_INDEX_FIXED_2);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // update the previous copy
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX_FIXED_2);
    gl.bindTexture(gl.TEXTURE_2D, textures[TEXTURE_INDEX_FIXED_2]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[TEXTURE_INDEX_FIXED_2]);

    gl.uniform1i(overlayUniformTexture, TEXTURE_INDEX_TRANSPARENT);
    gl.uniform1i(overlayUniformBackground, TEXTURE_INDEX_FIXED_1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // render to the output
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    count++;
    setTimeout(update, 1000 * count);
  }

  update();
};
I.src = 'c.png';
