export type MutableMat2D = [number, number, number, number, number, number];
export type Mat2D = readonly [number, number, number, number, number, number];

export const IDENTITY: Mat2D = [
  1,
  0,
  0,
  1,
  0,
  0,
];

export function multiply(m: Mat2D, ...rest: readonly Mat2D[]): MutableMat2D {
  return rest.reduce(function ([
    a0,
    a1,
    a2,
    a3,
    a4,
    a5,
  ]: MutableMat2D, [
    b0,
    b1,
    b2,
    b3,
    b4,
    b5,
  ]: Mat2D): MutableMat2D {
    return [
      a0 * b0 + a2 * b1,
      a1 * b0 + a3 * b1,
      a0 * b2 + a2 * b3,
      a1 * b2 + a3 * b3,
      a0 * b4 + a2 * b5 + a4,
      a1 * b4 + a3 * b5 + a5,
    ];
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  }, m as MutableMat2D);
}

export function rotate(rad: number): MutableMat2D {
  const s = Math.sin(rad);
  const c = Math.cos(rad);
  return [
    c,
    s,
    -s,
    c,
    0,
    0,
  ];
}

export function scale(x: number, y: number): MutableMat2D {
  return [
    x,
    0,
    0,
    y,
    0,
    0,
  ];
}

export function translate(x: number, y: number): MutableMat2D {
  return [
    1,
    0,
    0,
    1,
    x,
    y,
  ];
}
