import { test } from "tap";
import { findImports } from "../src";

void test("should skip directory in glob pattern", async (t) => {
  const list = ["tests/fixtures/"];
  const result = await findImports(list);
  const wanted = {};
  t.same(result, wanted);
});

void test("polyfill", async (t) => {
  const result = await findImports("tests/fixtures/polyfill.js");
  const wanted = {
    "tests/fixtures/polyfill.js": [
      "es5-shim/es5-shim",
      "es5-shim/es5-sham",
      "es6-shim/es6-shim",
      "es6-shim/es6-sham",
      "es6-symbol/implement",
      "es7-shim/es7-shim",
      "imports?this=>window!js-polyfills/cssom",
      "imports?self=>window!js-polyfills/dom",
      "imports?self=>window!js-polyfills/fetch",
      "imports?self=>window!js-polyfills/html",
      "imports?self=>window!js-polyfills/keyboard",
      "imports?this=>window!js-polyfills/timing",
      "imports?self=>window!js-polyfills/typedarray",
      "imports?self=>window!js-polyfills/url",
      "imports?self=>window!js-polyfills/web",
      "imports?self=>window!js-polyfills/xhr",
    ],
  };
  t.same(result, wanted);
});

void test("single glob pattern", async (t) => {
  const result = await findImports("tests/fixtures/app.js");
  const wanted = {
    "tests/fixtures/app.js": [
      "lodash",
      "fs",
      "path",
      "express",
      "consolidate",
      "errorhandler",
      "serve-favicon",
      "cookie-parser",
      "body-parser",
      "connect-multiparty",
      "connect-restreamer",
      "method-override",
      "morgan",
      "compression",
      "serve-static",
      "express-session",
      "session-file-store",
      "i18next",
      "i18next-node-fs-backend",
      "del",
      "i18next-express-middleware",
      "hogan.js",
    ],
  };
  t.same(result, wanted);
});

void test("a list of glob patterns", async (t) => {
  const files = ["tests/fixtures/**/app.js", "tests/fixtures/**/app.spec.js"];
  const result = await findImports(files);
  const wanted = {
    "tests/fixtures/app.js": [
      "lodash",
      "fs",
      "path",
      "express",
      "consolidate",
      "errorhandler",
      "serve-favicon",
      "cookie-parser",
      "body-parser",
      "connect-multiparty",
      "connect-restreamer",
      "method-override",
      "morgan",
      "compression",
      "serve-static",
      "express-session",
      "session-file-store",
      "i18next",
      "i18next-node-fs-backend",
      "del",
      "i18next-express-middleware",
      "hogan.js",
    ],
    "tests/fixtures/app.spec.js": ["tap"],
  };
  t.same(result, wanted);
});

void test("flatten output", async (t) => {
  const files = ["tests/fixtures/**/app.js", "tests/fixtures/**/app.spec.js"];
  const result = await findImports(files, { flatten: true });
  const wanted = [
    "lodash",
    "fs",
    "path",
    "express",
    "consolidate",
    "errorhandler",
    "serve-favicon",
    "cookie-parser",
    "body-parser",
    "connect-multiparty",
    "connect-restreamer",
    "method-override",
    "morgan",
    "compression",
    "serve-static",
    "express-session",
    "session-file-store",
    "i18next",
    "i18next-node-fs-backend",
    "del",
    "i18next-express-middleware",
    "hogan.js",
    "tap",
  ];
  t.same(result, wanted);
});

void test("relative imports", async (t) => {
  const files = ["tests/fixtures/relative-imports.js"];
  const result = await findImports(files, { relativeImports: true });
  const wanted = {
    "tests/fixtures/relative-imports.js": [
      "./lib/urljoin",
      "./lib/log",
      "./config/settings",
      "./api",
      "./lib/middleware/errclient",
      "./lib/middleware/errlog",
      "./lib/middleware/errnotfound",
      "./lib/middleware/errserver",
      "./index.css",
    ],
  };
  t.same(result, wanted);
});

void test("absolute imports", async (t) => {
  const files = ["tests/fixtures/absolute-imports.js"];
  const result = await findImports(files, { absoluteImports: true });
  const wanted = {
    "tests/fixtures/absolute-imports.js": [
      "/lib/urljoin",
      "/lib/log",
      "/config/settings",
      "/api",
      "/lib/middleware/errclient",
      "/lib/middleware/errlog",
      "/lib/middleware/errnotfound",
      "/lib/middleware/errserver",
      "/index.css",
    ],
  };
  t.same(result, wanted);
});

void test("only package imports", async (t) => {
  const files = ["tests/fixtures/mock-imports.js"];
  const result = await findImports(files);
  const wanted = {
    "tests/fixtures/mock-imports.js": [
      "package1",
      "package2",
      "package3",
      "package4/extras",
    ],
  };
  t.same(result, wanted);
});

void test("no package imports", async (t) => {
  const files = ["tests/fixtures/mock-imports.js"];
  const result = await findImports(files, { packageImports: false });
  const wanted = {
    "tests/fixtures/mock-imports.js": [],
  };
  t.same(result, wanted);
});

void test("only absolute imports", async (t) => {
  const files = ["tests/fixtures/mock-imports.js"];
  const result = await findImports(files, {
    absoluteImports: true,
    packageImports: false,
  });
  const wanted = {
    "tests/fixtures/mock-imports.js": [
      "/absolute1",
      "/absolute2",
      "/absolute3",
      "/absolute4/extras",
    ],
  };
  t.same(result, wanted);
});

void test("only relative imports", async (t) => {
  const files = ["tests/fixtures/mock-imports.js"];
  const result = await findImports(files, {
    relativeImports: true,
    packageImports: false,
  });
  const wanted = {
    "tests/fixtures/mock-imports.js": [
      "./relative1",
      "./relative2",
      "./relative3",
      "./relative4/extras",
    ],
  };
  t.same(result, wanted);
});

void test("syntax errors", async (t) => {
  const result = await findImports("tests/fixtures/syntax-errors.js");
  const wanted = {};
  t.same(result, wanted);
});

void test("negative glob", async (t) => {
  const list = [
    "tests/fixtures/**/app*.js",
    "!tests/fixtures/**/*.spec.js", // exclude *.spec.js
  ];
  const result = await findImports(list, { flatten: true });
  const wanted = [
    "lodash",
    "fs",
    "path",
    "express",
    "consolidate",
    "errorhandler",
    "serve-favicon",
    "cookie-parser",
    "body-parser",
    "connect-multiparty",
    "connect-restreamer",
    "method-override",
    "morgan",
    "compression",
    "serve-static",
    "express-session",
    "session-file-store",
    "i18next",
    "i18next-node-fs-backend",
    "del",
    "i18next-express-middleware",
    "hogan.js",
  ];
  t.same(result, wanted);
});
