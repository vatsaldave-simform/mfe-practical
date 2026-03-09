import type { Config } from 'prettier';

// Prettier formatting rules for the entire mfe-practical monorepo.
// All projects inherit this config automatically — no per-project .prettierrc needed.
// To verify: run `npx prettier --check .` from the workspace root.
const config: Config = {
  // Always print semicolons — avoids ASI (automatic semicolon insertion) surprises
  // in edge cases like lines starting with `[` or `(`.
  semi: true,

  // Single quotes for strings — consistent with most React/TS codebases and
  // reduces visual noise compared to double quotes.
  singleQuote: true,

  // Trailing commas in all positions (function params, arrays, objects).
  // Makes git diffs cleaner: adding a new last item only shows one changed line,
  // not two (the item + the preceding line gaining a comma).
  trailingComma: 'all',

  // Wrap lines at 100 characters — wide enough for modern monitors, narrow enough
  // to show two files side by side without scrolling.
  printWidth: 100,

  // 2-space indentation — standard for JS/TS/React projects.
  tabWidth: 2,

  // Always include parens around arrow function parameters even when there's
  // only one: `(x) => x` instead of `x => x`. Consistent and easier to add
  // destructuring or type annotations later without rewrapping.
  arrowParens: 'always',
};

export default config;
