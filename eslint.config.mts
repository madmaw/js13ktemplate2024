// this file cannot be in the src folder as it is referenced in a context that does not recognize project references

import js from "@eslint/js";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import { defineConfig } from "eslint/config";
import biome from "eslint-config-biome";
import { parseForESLint } from "eslint-parser-plain";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import globals from "globals";
import tseslint, {
  type ConfigArray,
  type ConfigWithExtends,
} from "typescript-eslint";
import mainProject from "./tsconfig.json";

type TSConfigProject = Partial<{
  compilerOptions: Partial<{
    baseUrl: string;
    [_: string]: unknown;
  }>;
  include: string[];
  exclude: string[];
  [_: string]: unknown;
}>;

function createESLintConfig({
  tsconfigRootDir,
  mainProject,
  srcFolder = mainProject.compilerOptions?.baseUrl ?? ".",
  otherProjects = [],
  extraGlobals = globals.browser,
}: {
  tsconfigRootDir: string;
  srcFolder?: string;
  mainProject: TSConfigProject;
  otherProjects?: readonly TSConfigProject[];
  extraGlobals?: Record<string, boolean>;
}): ConfigArray {
  const allProjects = [mainProject, ...otherProjects];
  const ignores = allProjects.flatMap(({ exclude }) => exclude ?? []);
  const [sourceFiles, supportingFiles] = [[mainProject], otherProjects].map(
    (projects) =>
      projects
        .flatMap(({ include }) => include ?? [])
        .flatMap((f) => {
          // assume it's a file with an extension
          if (f.includes(".")) {
            return f;
          }
          const dir = f.endsWith("/") ? f : `${f}/`;
          return [`${dir}**/*.ts`, `${dir}**/*.tsx`];
        })
        .filter(
          (f) => f.endsWith(".ts") || f.endsWith(".mts") || f.endsWith(".tsx"),
        ),
  );

  function createTSConfig(
    c: Partial<ConfigWithExtends>,
  ): ConfigWithExtends[] | undefined {
    if (c.files == null || c.files.length === 0) {
      return;
    }
    return [
      {
        ...c,
        extends: [
          tseslint.configs.recommendedTypeChecked,
          tseslint.configs.stylisticTypeChecked,
          comments.recommended,
          biome,
          js.configs.recommended,
          ...(c.extends ?? []),
        ],
        ignores: ["src/locales/**", ...(c.ignores ?? [])],
        languageOptions: {
          ...(c.languageOptions ?? {}),
          parserOptions: {
            // seems to cause errors in eslint.config.mts files and adds no other value?
            projectService: true,
            tsconfigRootDir,
            ...(c.languageOptions?.parserOptions ?? {}),
          },
        },
        plugins: {
          "no-relative-import-paths": noRelativeImportPaths,
          ...(c.plugins ?? {}),
        },
        rules: {
          // somewhat redundant with biome, otherwise discourages some safety checks
          // when enforcing `never` states (already off by default, so placeholder)
          // "@typescript-eslint/no-unnecessary-condition": "off",
          "@typescript-eslint/ban-ts-comment": [
            "error",
            {
              "ts-check": false,
              "ts-expect-error": true,
              "ts-ignore": true,
              "ts-nocheck": true,
            },
          ],
          // conflicts with biome
          "@typescript-eslint/consistent-type-definitions": "off",
          // biome does this
          "@typescript-eslint/no-empty-object-type": "off",
          "@typescript-eslint/no-floating-promises": [
            "error",
            {
              // make it cover cancellable promises too
              checkThenables: true,
            },
          ],
          // can be turned on in typescript compiler, but we need to remove all instances of it happening first
          "@typescript-eslint/no-unused-vars": [
            "error",
            {
              args: "all",
              argsIgnorePattern: "^_",
              caughtErrors: "all",
              caughtErrorsIgnorePattern: "^_",
              destructuredArrayIgnorePattern: "^_",
              ignoreRestSiblings: true,
              varsIgnorePattern: "^_",
            },
          ],
          // conflicts with biome
          "@typescript-eslint/non-nullable-type-assertion-style": "off",
          // we reference a lot of unbound methods in unit tests due to mocks and
          // mobx has an annotation called @action.bound that eslint doesn't understand
          "@typescript-eslint/unbound-method": "off",
          "default-case": "error",
          // biome does this
          "no-async-promise-executor": "off",
          // eslint doesn't understand typescript overloading
          "no-redeclare": "off",
          "no-relative-import-paths/no-relative-import-paths": [
            "error",
            {
              allowSameFolder: true,
              prefix: "",
              rootDir: srcFolder,
            },
          ],
          "no-undef": "off",
          // @typescript-eslint/no-unused-vars does this better
          "no-unused-vars": "off",
          "require-await": "error",
          // biome does this
          "require-yield": "off",
          // == is fine for code golfing
          // eqeqeq: ['error', 'always', { null: 'never' }],
          ...(c.rules ?? {}),
        },
      },
    ];
  }

  return [
    {
      // NOTE: if `ignores` isn't on it's own it will not apply globally
      ignores,
    },
    ...defineConfig({
      // files not covered by biome
      files: [
        "*.yaml",
        ".gitignore",
        ".npmrc",
        ".env.example",
        "*.md",
        "*.html",
      ],
      ignores: ["pnpm-lock.yaml"],
      languageOptions: {
        parser: {
          // turn off all language features
          parseForESLint,
        },
      },
      rules: {
        "eol-last": ["error", "always"],
        "no-multiple-empty-lines": [
          "error",
          {
            max: 1,
            maxBOF: 0,
            maxEOF: 0,
          },
        ],
        "no-trailing-spaces": ["error"],
      },
    }),
    ...tseslint.config(
      [
        createTSConfig({
          files: sourceFiles,
          languageOptions: {
            globals: {
              JSX: true,
              React: true,
              ...globals.vitest,
              ...extraGlobals,
            },
            parserOptions: {
              ecmaFeatures: {
                jsx: true,
              },
            },
          },
        }),
        createTSConfig({
          files: supportingFiles,
          languageOptions: {
            globals: {
              ...globals.node,
            },
          },
        }),
      ].filter((v) => v != null),
    ),
  ];
}

const eslintConfig: ConfigArray = createESLintConfig({
  mainProject,
  tsconfigRootDir: import.meta.dirname,
});

export default eslintConfig;
