"use strict";

/**
 * 构建前端口表校验（Node >= 18 可用）。
 *
 * 端口数据仍以 lib/pipelinePorts.ts 为唯一来源；这里用项目自带的
 * typescript 包即时转译并执行该文件，避免 Node 20 无法直接运行 .ts，
 * 也避免在 .js/.ts 两份文件里复制端口常量造成漂移。
 */
const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "../lib/pipelinePorts.ts");
const source = fs.readFileSync(sourcePath, "utf8");

const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
  },
}).outputText;

const mod = { exports: {} };
// pipelinePorts.ts 无运行时依赖；仅导出纯数据与校验函数，可安全在沙箱函数中执行
new Function("exports", "require", "module", "__filename", "__dirname", transpiled)(
  mod.exports,
  require,
  mod,
  sourcePath,
  path.dirname(sourcePath)
);

const { PIPELINE_PORTS, STAGE_CONNECTIONS, validatePipelinePorts } = mod.exports;

if (typeof validatePipelinePorts !== "function") {
  console.error("[validate-ports] FAILED: pipelinePorts.ts did not export validatePipelinePorts");
  process.exit(1);
}

const errors = validatePipelinePorts();
const portCount = [
  PIPELINE_PORTS.brine.outlet,
  PIPELINE_PORTS.evaporate.brineInlet,
  PIPELINE_PORTS.evaporate.saltOutlet,
  PIPELINE_PORTS.centrifuge.inlet,
  PIPELINE_PORTS.centrifuge.wetOutlet,
  PIPELINE_PORTS.dry.inlet,
  PIPELINE_PORTS.dry.outlet,
  PIPELINE_PORTS.pack.inlet,
].length;

if (errors.length > 0) {
  console.error(`[validate-ports] FAILED (${errors.length} issues):`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(
  `[validate-ports] OK: ${portCount} ports, ${STAGE_CONNECTIONS.length} cross-stage connections validated.`
);
