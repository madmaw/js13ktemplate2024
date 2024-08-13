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
  GLSLX_NAME_A_MODEL_POSITION as CRT_BEND_A_MODEL_POSITION,
  GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION as CRT_BEND_U_MODEL_POSITION_TO_SCREEN_POSITION,
  GLSLX_NAME_U_SCALE as CRT_BEND_U_SCALE,
  GLSLX_NAME_U_SCREEN_POSITION_TO_TEXTURE_COORD as CRT_BEND_U_SCREEN_POSITION_TO_TEXTURE_COORD,
  GLSLX_NAME_U_TEXTURE as CRT_BEND_U_TEXTURE,
  GLSLX_SOURCE_FRAGMENT as CRT_BEND_SOURCE_FRAGMENT,
  GLSLX_SOURCE_VERTEX as CRT_BEND_SOURCE_VERTEX,
} from './shaders/crt_bend';
import {
  GLSLX_NAME_A_MODEL_POSITION as CRT_PIXELATE_A_MODEL_POSITION,
  GLSLX_NAME_U_MODEL_POSITION_TO_PIXEL_POSITION as CRT_PIXELATE_U_MODEL_POSITION_TO_PIXEL_POSITION,
  GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION as CRT_PIXELATE_U_MODEL_POSITION_TO_SCREEN_POSITION,
  GLSLX_NAME_U_PIXELS as CRT_PIXELATE_U_PIXELS,
  GLSLX_NAME_U_TEXTURE as CRT_PIXELATE_U_TEXTURE,
  GLSLX_SOURCE_FRAGMENT as CRT_PIXELATE_SOURCE_FRAGMENT,
  GLSLX_SOURCE_VERTEX as CRT_PIXELATE_SOURCE_VERTEX,
} from './shaders/crt_pixelate';
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

// changing these values results in a black screen?!
const FIXED_WIDTH = 320;
const FIXED_HEIGHT = 240;

// const ctx = transparent.getContext('2d', {
//   alpha: true,
// })!;
// ctx.fillStyle = 'red';
// ctx.fillRect(0, 0, transparent.width, transparent.height);
// document.body.appendChild(transparent);

const images = [
  'c.png', // sprite sheet
  'b.bmp', // crt pixels
  'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', // transparent
].map(function (src) {
  const image = new Image();
  image.onload = function () {
    imageLoadCount--;
    if (!imageLoadCount) {
      imagesLoaded();
    }
  };
  image.src = src;
  return image;
});
const [
  spritesheet,
  crtPixels,
] = images;
let imageLoadCount = images.length;

const TEXTURE_INDEX_FIXED_1 = 0;
const TEXTURE_INDEX_FIXED_2 = 1;
const TEXTURE_INDEX_SCALED_1 = 2;
const TEXTURE_INDEX_SCALED_2 = 3;
const TEXTURE_INDEX_FIXED_COPY = 4;
const TEXTURE_INDEX_SPRITE_SHEET = 5;
const TEXTURE_INDEX_CRT_PIXELS = 6;
const TEXTURE_INDEX_TRANSPARENT = 7;
const TEXTURE_DEFS: TextureDef[] = [
  // 0
  {
    empty: 1,
    width: FIXED_WIDTH,
    height: FIXED_HEIGHT,
  },
  // 1
  {
    empty: 1,
    width: FIXED_WIDTH,
    height: FIXED_HEIGHT,
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
  {
    empty: 1,
    width: FIXED_WIDTH,
    height: FIXED_HEIGHT,
  },
  // 5, 6, 7
  ...images,
];

const SQUARE = [
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

function imagesLoaded() {
  const gl = Z.getContext('webgl')!;

  let textures: WebGLTexture[] = [];
  let framebuffers: WebGLFramebuffer[] = [];
  function setTarget(textureIndex: number) {
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
          SQUARE,
        ],
      ],
      function (
        [
          uniformTexture,
          uniformBackground,
          uniformModelPositionToTextureCoord,
          uniformModelPositionToScreenPosition,
          uniformScreenPositionToBackgroundCoord,
          uniformPalette,
          uniformLightNormal,
        ],
        outputTextureIndex,
      ) {
        gl.uniformMatrix3fv(
          uniformModelPositionToTextureCoord,
          false,
          IDENTITY,
        );
        gl.uniformMatrix3fv(
          uniformScreenPositionToBackgroundCoord,
          false,
          multiply(
            scale(.5, .5),
            translate(1, 1),
          ),
        );
        gl.uniform4fv(
          uniformPalette,
          [
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
          ],
        );

        gl.uniform3fv(
          uniformLightNormal,
          normalize([
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
          ]),
        );
        // clear the copy (may not be necessary)
        setTarget(TEXTURE_INDEX_FIXED_COPY);
        gl.clear(gl.COLOR_BUFFER_BIT);

        for (let i = 0; i < 2; i++) {
          const m = multiply(
            translate(
              -Math.round(Math.random() * FIXED_WIDTH) / FIXED_WIDTH,
              1 - Math.round(Math.random() * FIXED_HEIGHT) / FIXED_HEIGHT,
            ),
            scale(1, -1),
          );
          gl.uniformMatrix3fv(
            uniformModelPositionToScreenPosition,
            false,
            m,
          );

          // update the target
          setTarget(outputTextureIndex);

          gl.uniform1i(uniformTexture, TEXTURE_INDEX_SPRITE_SHEET);
          gl.uniform1i(uniformBackground, TEXTURE_INDEX_FIXED_COPY);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

          // update the copy
          setTarget(TEXTURE_INDEX_FIXED_COPY);

          gl.uniform1i(uniformTexture, TEXTURE_INDEX_TRANSPARENT);
          // gl.uniform1i(uniformTexture, TEXTURE_INDEX_SPRITE_SHEET);
          gl.uniform1i(uniformBackground, outputTextureIndex);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      },
    ],
    //
    // CRT Pixelate
    //
    [
      CRT_PIXELATE_SOURCE_VERTEX,
      CRT_PIXELATE_SOURCE_FRAGMENT,
      [
        CRT_PIXELATE_U_TEXTURE,
        CRT_PIXELATE_U_PIXELS,
        CRT_PIXELATE_U_MODEL_POSITION_TO_SCREEN_POSITION,
        CRT_PIXELATE_U_MODEL_POSITION_TO_PIXEL_POSITION,
      ],
      [
        [
          CRT_PIXELATE_A_MODEL_POSITION,
          SQUARE,
        ],
      ],
      function ([
        _uniformTexture,
        uniformPixels,
        uniformModelPositionToScreenPosition,
        uniformModelPositionToPixelPosition,
      ]) {
        gl.uniformMatrix3fv(
          uniformModelPositionToScreenPosition,
          false,
          multiply(
            translate(-1, -1),
            scale(2, 2),
          ),
        );
        gl.uniform1i(
          uniformPixels,
          TEXTURE_INDEX_CRT_PIXELS,
        );
        gl.uniformMatrix3fv(
          uniformModelPositionToPixelPosition,
          false,
          scale(
            FIXED_WIDTH / crtPixels.width,
            FIXED_HEIGHT / crtPixels.height,
          ),
        );
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    ],
    //
    // CRT Bend
    //
    [
      CRT_BEND_SOURCE_VERTEX,
      CRT_BEND_SOURCE_FRAGMENT,
      [
        CRT_BEND_U_TEXTURE,
        CRT_BEND_U_SCALE,
        CRT_BEND_U_MODEL_POSITION_TO_SCREEN_POSITION,
        CRT_BEND_U_SCREEN_POSITION_TO_TEXTURE_COORD,
      ],
      [
        [
          CRT_BEND_A_MODEL_POSITION,
          SQUARE,
        ],
      ],
      function ([
        _uniformTexture,
        uniformScale,
        uniformModelPositionToScreenPosition,
        uniformScreenPositionToTextureCoord,
      ]) {
        gl.uniform3f(uniformScale, .8, 3, 4);
        gl.uniformMatrix3fv(
          uniformScreenPositionToTextureCoord,
          false,
          multiply(
            scale(.5, .5),
            translate(1, 1),
          ),
        );
        gl.uniformMatrix3fv(
          uniformModelPositionToScreenPosition,
          false,
          multiply(
            translate(-1, -1),
            scale(2, 2),
          ),
        );
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    ],
  ] as const;

  const pipeline = programs.map(function (program) {
    return compileStep(gl, program);
  });
  // pipeline.splice(1, 1);

  // gl.clearColor(1, 0, 1, 1);
  // gl.clear(gl.COLOR_BUFFER_BIT);
  // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // gl.clear(gl.COLOR_BUFFER_BIT);

  // setTarget(TEXTURE_INDEX_FIXED_2);
  gl.clearColor(0, 0, 0, 0);

  let count = 0;

  function update() {
    pipeline.reduce(function (inputTextureIndex, step, i) {
      const scaled = i;
      // can also do: startingIndex = Math.min(1, i) * 2;
      const startingIndex = scaled ? TEXTURE_INDEX_SCALED_1 : TEXTURE_INDEX_FIXED_1;
      const outputTextureIndex = i % 2 + startingIndex;
      if (i == pipeline.length - 1) {
        // render to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        setTarget(outputTextureIndex);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);

      const [
        width,
        height,
      ] = scaled
        ? [
          innerWidth,
          innerHeight,
        ]
        : [
          FIXED_WIDTH,
          FIXED_HEIGHT,
        ];
      Z.width = width;
      Z.height = height;
      gl.viewport(0, 0, width, height);

      step(inputTextureIndex, outputTextureIndex);
      return outputTextureIndex;
    }, TEXTURE_INDEX_FIXED_2);
    count++;
    setTimeout(update, 1000 * count);
  }

  update();
}
