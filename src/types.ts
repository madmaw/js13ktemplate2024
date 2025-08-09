export type Falsey = 0 | false | undefined | null;
export type Truthy = Exclude<number, 0> | true | object;
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type Booleanish = Falsey | Truthy;
