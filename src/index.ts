import fs from "fs";
import path from "path";
import ensureArray from "ensure-array";
import _get from "lodash.get";
import _values from "lodash.values";
import _uniq from "lodash.uniq";
import _flatten from "lodash.flatten";
import * as parser from "@typescript-eslint/typescript-estree";
import glob from "fast-glob";

interface Options {
  packageImports: boolean;
  absoluteImports: boolean;
  relativeImports: boolean;
  flatten: boolean;
  ignore: string[];
  absolute: boolean;
}

const defaultOptions = {
  packageImports: true,
  absoluteImports: false,
  relativeImports: false,
  ignore: [],
  flatten: false,
  absolute: false,
};

function isRequireExpression(o: parser.TSESTree.BaseNode | null): boolean {
  return (
    _get(o, "type") === "CallExpression" &&
    _get(o, "callee.type") === "Identifier" &&
    _get(o, "callee.name") === "require" &&
    _get(o, "arguments[0].type") === "Literal"
  );
}

function addModule(
  records: Record<string, string[]>,
  options: Partial<Options>,
  modulePath: string,
  value: string
) {
  if (value[0] === "/") {
    if (options.absoluteImports) {
      records[modulePath].push(value);
    }
  } else if (value[0] === ".") {
    if (options.relativeImports) {
      records[modulePath].push(value);
    }
  } else if (options.packageImports) {
    records[modulePath].push(value);
  }
}

// @params {string|array} patterns The glob pattern or a list of glob patterns.
// @params {object} options The options object.
// @params {boolean} [options.flatten] True to flatten the output, defaults to false.
// @params {boolean} [options.packageImports] True to return package imports, defaults to true.
// @params {boolean} [options.absoluteImports] True to return absolute imports, defaults to false.
// @params {boolean} [options.relativeImports] True to return relative imports, defaults to false.
export async function findImports(
  patterns: string | string[] = [],
  options: Partial<Options> = defaultOptions,
  cwd: string = process.cwd()
) {
  let requiredModules: Record<string, string[]> | string[] = {};

  // options
  const _options = Object.assign({}, defaultOptions, options);
  const ignore = _options.ignore || [];
  const absolute = _options.absolute || false;

  const filePaths = await glob(patterns, {
    cwd: cwd,
    ignore: ignore,
    absolute: absolute,
    onlyFiles: true,
  });
  filePaths.forEach(function (filepath) {
    let modulePath: string = "";
    try {
      modulePath = path.relative(cwd, filepath);
      const tree = parser.parse(fs.readFileSync(filepath).toString());

      (requiredModules as Record<string, string[]>)[modulePath] = [];

      tree.body.forEach(function (node) {
        if (
          node.type === "ExpressionStatement" &&
          node.expression.type === "CallExpression" &&
          node.expression.callee.type === "MemberExpression" &&
          node.expression.callee.object.type === "CallExpression" &&
          // @ts-ignore
          node.expression.callee.object.callee.name === "require"
        ) {
          addModule(
            requiredModules as Record<string, string[]>,
            _options,
            modulePath,
            // @ts-ignore
            node.expression.callee.object.arguments[0].value
          );
          return;
        } else if (
          node.type === parser.AST_NODE_TYPES.ExpressionStatement &&
          node.expression.type === parser.AST_NODE_TYPES.CallExpression &&
          // @ts-ignore
          node.expression.callee.name === "require"
        ) {
          addModule(
            requiredModules as Record<string, string[]>,
            _options,
            modulePath,
            // @ts-ignore
            node.expression.arguments[0].value as unknown as string
          );
          return;
        } else if (node.type === "VariableDeclaration") {
          node.declarations.forEach(function (decl) {
            var expr = decl.init;
            if (isRequireExpression(expr)) {
              addModule(
                requiredModules as Record<string, string[]>,
                _options,
                modulePath,
                _get(expr, "arguments[0].value")
              );
              return;
            }

            var exprArguments = ensureArray(_get(decl, "init.arguments"));
            exprArguments.forEach(function (exprArgument) {
              if (isRequireExpression(exprArgument)) {
                addModule(
                  requiredModules as Record<string, string[]>,
                  _options,
                  modulePath,
                  _get(exprArgument, "arguments[0].value")
                );
              }
            });
          });
          return;
        } else if (node.type === "ImportDeclaration") {
          addModule(
            requiredModules as Record<string, string[]>,
            _options,
            modulePath,
            // @ts-ignore
            node.source.value
          );
          return;
        } else if (node.type === "ExportAllDeclaration") {
          addModule(
            requiredModules as Record<string, string[]>,
            _options,
            modulePath,
            // @ts-ignore
            node.source.value
          );
          return;
        }
      });
    } catch (e) {
      console.error("Error in `" + modulePath + "`: " + e);
    }
  });
  if (options.flatten) {
    requiredModules = _uniq(_flatten(_values(requiredModules)));
  }
  return requiredModules;
}
