export type Falsey = 0 | false | undefined | null;
export type Truthy = Exclude<number, 0> | true | object;
export type Booleanish = Falsey | Truthy;
