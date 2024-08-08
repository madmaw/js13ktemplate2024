import { type Mat2D } from './mat2d';

export type Mat3 = readonly [
  // 0
  number,
  number,
  number,
  // 1
  number,
  number,
  number,
  // 2
  number,
  number,
  number,
];
export type MutableMat3 = [
  // 0
  number,
  number,
  number,
  // 1
  number,
  number,
  number,
  // 2
  number,
  number,
  number,
];

export const IDENTITY: Mat3 = [
  // 0
  1,
  0,
  0,
  // 1
  0,
  1,
  0,
  // 2
  0,
  0,
  1,
];

export function multiply(m: Mat3, ...rest: readonly Mat3[]): MutableMat3 {
  return rest.reduce(function ([
    a00,
    a01,
    a02,
    a10,
    a11,
    a12,
    a20,
    a21,
    a22,
  ]: MutableMat3, [
    b00,
    b01,
    b02,
    b10,
    b11,
    b12,
    b20,
    b21,
    b22,
  ]: Mat3): MutableMat3 {
    return [
      // 0
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      // 1
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      // 2
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  }, m as MutableMat3);
}

export function rotate(rad: number): MutableMat3 {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  return [
    // 0
    c,
    s,
    0,
    // 1
    -s,
    c,
    0,
    // 2
    0,
    0,
    1,
  ];
}

export function scale(x: number, y: number): MutableMat3 {
  return [
    // 0
    x,
    0,
    0,
    // 1
    0,
    y,
    0,
    // 2
    0,
    0,
    1,
  ];
}

export function translate(x: number, y: number): MutableMat3 {
  return [
    // 0
    1,
    0,
    0,
    // 1
    0,
    1,
    0,
    // 2
    x,
    y,
    1,
  ];
}

export function fromMat2D([
  a0,
  a1,
  a2,
  a3,
  a4,
  a5,
]: Mat2D): MutableMat3 {
  return [
    a0,
    a1,
    0,
    a2,
    a3,
    0,
    a4,
    a5,
    1,
  ];
}
