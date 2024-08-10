export function length<A extends number[]>(v: Readonly<A>): number {
  return Math.sqrt(
    v.reduce(function (acc, v) {
      return acc + v * v;
    }, 0),
  );
}

export function multiply<A extends number[]>(v: Readonly<A>, m: number): A {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return v.map(function (v) {
    return v * m;
  }) as A;
}

export function normalize<A extends number[]>(v: Readonly<A>): A {
  return multiply(v, 1 / length(v));
}
