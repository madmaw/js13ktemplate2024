export function length<A extends number[]>(v: Readonly<A>): number {
  return Math.sqrt(v.reduce((acc, v) => acc + v * v, 0));
}

export function multiply<A extends number[]>(v: Readonly<A>, m: number): A {
  return v.map((v) => v * m) as A;
}

export function normalize<A extends number[]>(v: Readonly<A>): A {
  return multiply(v, 1 / length(v));
}
