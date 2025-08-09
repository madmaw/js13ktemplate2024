// import b from '../assets/b.bmp';
import { FLAG_GENERATE_PIXELS } from "flags";
import { IDENTITY, multiply, scale, translate } from "math/mat3";
import { normalize } from "math/vec";
import {
  GLSLX_NAME_A_MODEL_POSITION as CRT_BEND_A_MODEL_POSITION,
  GLSLX_SOURCE_FRAGMENT as CRT_BEND_SOURCE_FRAGMENT,
  GLSLX_SOURCE_VERTEX as CRT_BEND_SOURCE_VERTEX,
  GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION as CRT_BEND_U_MODEL_POSITION_TO_SCREEN_POSITION,
  GLSLX_NAME_U_SCALE as CRT_BEND_U_SCALE,
  GLSLX_NAME_U_SCREEN_POSITION_TO_TEXTURE_COORD as CRT_BEND_U_SCREEN_POSITION_TO_TEXTURE_COORD,
  GLSLX_NAME_U_TEXTURE as CRT_BEND_U_TEXTURE,
} from "shaders/crt_bend";
import {
  GLSLX_NAME_A_MODEL_POSITION as CRT_PIXELATE_A_MODEL_POSITION,
  GLSLX_SOURCE_FRAGMENT as CRT_PIXELATE_SOURCE_FRAGMENT,
  GLSLX_SOURCE_VERTEX as CRT_PIXELATE_SOURCE_VERTEX,
  GLSLX_NAME_U_MODEL_POSITION_TO_PIXEL_POSITION as CRT_PIXELATE_U_MODEL_POSITION_TO_PIXEL_POSITION,
  GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION as CRT_PIXELATE_U_MODEL_POSITION_TO_SCREEN_POSITION,
  GLSLX_NAME_U_PIXELS as CRT_PIXELATE_U_PIXELS,
  GLSLX_NAME_U_TEXTURE as CRT_PIXELATE_U_TEXTURE,
} from "shaders/crt_pixelate";
import {
  GLSLX_NAME_A_MODEL_POSITION as OVERLAY_A_MODEL_POSITION,
  GLSLX_SOURCE_FRAGMENT as OVERLAY_SOURCE_FRAGMENT,
  GLSLX_SOURCE_VERTEX as OVERLAY_SOURCE_VERTEX,
  GLSLX_NAME_U_BACKGROUND as OVERLAY_U_BACKGROUND,
  GLSLX_NAME_U_LIGHT_NORMAL as OVERLAY_U_LIGHT_NORMAL,
  GLSLX_NAME_U_MODEL_POSITION_TO_SCREEN_POSITION as OVERLAY_U_MODEL_POSITION_TO_SCREEN_POSITION,
  GLSLX_NAME_U_MODEL_POSITION_TO_TEXTURE_COORD as OVERLAY_U_MODEL_POSITION_TO_TEXTURE_COORD,
  GLSLX_NAME_U_PALETTE as OVERLAY_U_PALETTE,
  GLSLX_NAME_U_SCREEN_POSITION_TO_BACKGROUND_COORD as OVERLAY_U_SCREEN_POSITION_TO_BACKGROUND_COORD,
  GLSLX_NAME_U_TEXTURE as OVERLAY_U_TEXTURE,
} from "shaders/overlay";
import {
  compileStep,
  createTextures,
  type StepDefinition,
  type TextureDef,
} from "util/webgl";

// changing these values results in a black screen?!
const FIXED_WIDTH = 320;
const FIXED_HEIGHT = 240;

type GameState = number;

// const ctx = transparent.getContext('2d', {
//   alpha: true,
// })!;
// ctx.fillStyle = 'red';
// ctx.fillRect(0, 0, transparent.width, transparent.height);
// document.body.appendChild(transparent);

const images: (HTMLImageElement | HTMLCanvasElement)[] = [
  // 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAQCAYAAAArij59AAAAAXNSR0IArs4c6QAAAWZJREFUKFNNkeFO2gAYRc9HAxRBoDhFqpmLbu//Ijjixo/92ACJUAShrYVaIHAXIEt2H+Dcc3NNy64oZwTUeeUBAa0/cB0B7grTS0ebmx1DXN65gbBOdQyfMyg4I2w2aCvyjCRXZJ80yEXnVD52NBRSyifYZN/W1Mpstk1ygUdtDv4+wc2P4XKF7fVdv7k64osx3A6hvgGqL/B1hkkd9fFZcEUpg/seuBlQn8J9gKV61DMXrLgjP4NWAJdboDyALwusF3WVFh0sOUfvHvlMNCyioph1JYf9+rFUw4mo7GM2Z2LegLRo2LKKFh42fZJOyOcjMnPF4F/lG1jalQ5yeK9HqUN6tAhpHqUt+inV1odZI/g2Q4j/Z1v/UfIVUshPUDMlaMIbZbYfPhZUsXF7rKoTsqtkhJ6ISwW2WQ2b1zlbOZjaC1E7vTMqOMz4xG5zizsEPwZTR+L69G9KiT53rClTm8DDBP4CJJO/dzetQusAAAAASUVORK5CYII=',
  "b.bmp",
  "c.png", // sprite sheet
  "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", // transparent
].map((src) => {
  const image = new Image();
  image.onload = () => {
    imageLoadCount--;
    if (!imageLoadCount) {
      imagesLoaded();
    }
  };
  image.src = src;
  return image;
});
let imageLoadCount = images.length;

if (FLAG_GENERATE_PIXELS) {
  const canvas = document.createElement("canvas");
  const sqrt = 4;
  const width = 8;
  const height = 16;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#CCC";
  ctx.globalCompositeOperation = "lighter";
  const r = height / 4;
  const count = sqrt * sqrt * 2 * 3;
  const colors = ["#300", "#030", "#003"];
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / (sqrt * 3));
    const x = ((i % (sqrt * 3)) * width) / (sqrt - 1) - width / ((row % 2) + 1);
    const y = (row * height) / (sqrt - 1);
    const gradient = ctx.createRadialGradient(x, y, r / 2, x, y, r);
    gradient.addColorStop(0, colors[(i + row + (row % 2)) % colors.length]);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  // console.log(canvas.toDataURL())
  images[0] = canvas;
}

const TEXTURE_INDEX_FIXED_1 = 0;
const TEXTURE_INDEX_FIXED_2 = 1;
const TEXTURE_INDEX_SCALED_1 = 2;
const _TEXTURE_INDEX_SCALED_2 = 3;
const TEXTURE_INDEX_FIXED_COPY = 4;
const TEXTURE_INDEX_CRT_PIXELS = 5;
const TEXTURE_INDEX_SPRITE_SHEET = 6;
const TEXTURE_INDEX_TRANSPARENT = 7;
const TEXTURE_DEFS: TextureDef[] = [
  // 0
  {
    empty: 1,
    height: FIXED_HEIGHT,
    width: FIXED_WIDTH,
  },
  // 1
  {
    empty: 1,
    height: FIXED_HEIGHT,
    width: FIXED_WIDTH,
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
    height: FIXED_HEIGHT,
    width: FIXED_WIDTH,
  },
  // 5, 6, 7
  ...images,
];

const SQUARE = [
  // 0
  0, 0, 1,
  // 1
  1, 0, 1,
  // 2
  0, 1, 1,
  // 3
  1, 1, 1,
] as const;

function imagesLoaded() {
  const gl = Z.getContext("webgl")!;

  let textures: WebGLTexture[] = [];
  let framebuffers: WebGLFramebuffer[] = [];
  function setTarget(textureIndex: number) {
    gl.activeTexture(gl.TEXTURE0 + textureIndex);
    gl.bindTexture(gl.TEXTURE_2D, textures[textureIndex]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[textureIndex]);
  }

  function resize() {
    textures.map((texture) => {
      gl.deleteTexture(texture);
    });
    framebuffers.map((framebuffer) => {
      gl.deleteFramebuffer(framebuffer);
    });
    textures = createTextures(gl, TEXTURE_DEFS);
    framebuffers = textures
      .slice(0, TEXTURE_INDEX_CRT_PIXELS)
      .map((texture) => {
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        return fb;
      });
  }
  onresize = resize;
  resize();

  const programs: StepDefinition<GameState>[] = [
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
      [[OVERLAY_A_MODEL_POSITION, SQUARE]],
      (
        [
          uniformTexture,
          uniformBackground,
          uniformModelPositionToTextureCoord,
          uniformModelPositionToScreenPosition,
          uniformScreenPositionToBackgroundCoord,
          uniformPalette,
          uniformLightNormal,
        ],
        gameState,
        outputTextureIndex,
      ) => {
        gl.uniformMatrix3fv(
          uniformModelPositionToTextureCoord,
          false,
          IDENTITY,
        );
        gl.uniformMatrix3fv(
          uniformScreenPositionToBackgroundCoord,
          false,
          multiply(scale(0.5, 0.5), translate(1, 1)),
        );
        gl.uniform4fv(
          uniformPalette,
          [
            // 0 transparent
            0.5, 0.5, 0.5, 0,
            // 1 yellow
            0.8, 0.8, 0.2, 1,
            // 2 dark
            0.5, 0.4, 0.4, 1,
            // 3 metal
            0.3, 0.5, 1, 1,
          ],
        );

        gl.uniform3fv(
          uniformLightNormal,
          normalize([
            Math.cos(gameState / 1000),
            Math.sin(gameState / 1000),
            Math.sin(gameState / 10000),
          ]),
        );
        // clear the copy (may not be necessary)
        setTarget(TEXTURE_INDEX_FIXED_COPY);
        gl.clear(gl.COLOR_BUFFER_BIT);

        for (let i = 0; i < 3; i++) {
          const m = multiply(
            translate(
              (i - 1) / 2, // -Math.round(Math.random() * FIXED_WIDTH) / FIXED_WIDTH,
              0, // 1 - Math.round(Math.random() * FIXED_HEIGHT) / FIXED_HEIGHT,
            ),
            scale(1, -1),
          );
          gl.uniformMatrix3fv(uniformModelPositionToScreenPosition, false, m);

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
      [[CRT_PIXELATE_A_MODEL_POSITION, SQUARE]],
      ([
        _uniformTexture,
        uniformPixels,
        uniformModelPositionToScreenPosition,
        uniformModelPositionToPixelPosition,
      ]) => {
        gl.uniformMatrix3fv(
          uniformModelPositionToScreenPosition,
          false,
          multiply(scale(5, 5), translate(-0.5, -0.5)),
        );
        gl.uniform1i(uniformPixels, TEXTURE_INDEX_CRT_PIXELS);
        gl.uniformMatrix3fv(
          uniformModelPositionToPixelPosition,
          false,
          scale(FIXED_WIDTH * 25, FIXED_HEIGHT * 25),
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
      [[CRT_BEND_A_MODEL_POSITION, SQUARE]],
      ([
        _uniformTexture,
        uniformScale,
        uniformModelPositionToScreenPosition,
        uniformScreenPositionToTextureCoord,
      ]) => {
        gl.uniform3f(uniformScale, 0.8, 2, 2);
        gl.uniformMatrix3fv(
          uniformScreenPositionToTextureCoord,
          false,
          multiply(scale(0.5, 0.5), translate(1, 1)),
        );
        gl.uniformMatrix3fv(
          uniformModelPositionToScreenPosition,
          false,
          multiply(translate(-1, -1), scale(2, 2)),
        );
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    ],
  ] as const;

  const pipeline = programs.map((program) =>
    compileStep<GameState>(gl, program),
  );
  // pipeline.splice(1, 1);

  // gl.clearColor(1, 0, 1, 1);
  // gl.clear(gl.COLOR_BUFFER_BIT);
  // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // gl.clear(gl.COLOR_BUFFER_BIT);

  // setTarget(TEXTURE_INDEX_FIXED_2);
  gl.clearColor(0, 0, 0, 0);

  function update(now: number) {
    pipeline.reduce((inputTextureIndex, step, i) => {
      const scaled = i;
      // can also do: startingIndex = Math.min(1, i) * 2;
      const startingIndex = scaled
        ? TEXTURE_INDEX_SCALED_1
        : TEXTURE_INDEX_FIXED_1;
      const outputTextureIndex = (i % 2) + startingIndex;
      if (i == pipeline.length - 1) {
        // render to screen
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        setTarget(outputTextureIndex);
      }
      gl.clear(gl.COLOR_BUFFER_BIT);

      const [width, height] = scaled
        ? [innerWidth, innerHeight]
        : [FIXED_WIDTH, FIXED_HEIGHT];
      Z.width = width;
      Z.height = height;
      gl.viewport(0, 0, width, height);

      step(now, inputTextureIndex, outputTextureIndex);
      return outputTextureIndex;
    }, TEXTURE_INDEX_FIXED_2);
    requestAnimationFrame(update);
  }

  update(0);
}
