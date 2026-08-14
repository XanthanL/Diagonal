/**
 * 构建前端口表校验：
 *   node scripts/validate-ports.ts
 *
 * 直接执行 TypeScript（Node >= 23 原生 strip-types）。
 * 若端口坐标/连接关系被改坏，本脚本以非零退出码阻断构建。
 */
import { PIPELINE_PORTS, STAGE_CONNECTIONS, validatePipelinePorts } from "../lib/pipelinePorts.ts";

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
