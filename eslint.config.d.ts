// this packages lacks type definitions, so we trick TS here
declare module "eslint-config-biome";
declare module "@eslint-community/eslint-plugin-eslint-comments/configs" {
  export const recommended: object;
}
