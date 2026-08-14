/**
 * 跨环节管道端口表：整条产线唯一的端口坐标来源。
 *
 * 设计约定：
 * - 端口坐标一律为「世界坐标」。
 * - 各环节单元内部只允许使用局部坐标；只有跨环节管道（PipelineScene）
 *   和本表使用世界坐标。任何单元内部都不得再叠加 STAGE_X.*，否则会被
 *   `npm run validate:ports` 之外的重复坐标检查发现。
 * - 本文件不 import 任何运行时模块，Node 23 可直接 strip-types 执行，
 *   供 scripts/validate-ports.ts 做构建前自动校验。
 */

export type PipelineStageId = "brine" | "evaporate" | "centrifuge" | "dry" | "pack";
export type PipelinePortRole = "inlet" | "outlet";

export interface PipelinePort {
  /** 端口唯一 id，如 brine.outlet / pack.inlet */
  id: string;
  /** 所属环节 */
  stageId: PipelineStageId;
  /** 端口角色 */
  role: PipelinePortRole;
  /** 世界坐标 */
  pos: [number, number, number];
  /** 物料说明（用于校验日志与未来 HUD 复用） */
  label: string;
}

// 环节中心 x 坐标（从左到右）
export const STAGE_X = {
  brine: -20,
  evaporate: -6,
  centrifuge: 4,
  dry: 12,
  pack: 21,
} as const;

// 地面平台范围
export const PLATFORM = {
  xMin: -27,
  xMax: 26,
  depth: 7,
  y: -2.6,
} as const;

/** 产线整体几何度量（用于自适应取景与端口校验） */
export const PIPELINE = {
  centerX: (PLATFORM.xMin + PLATFORM.xMax) / 2,
  centerY: 0.4,
  halfWidth: (PLATFORM.xMax - PLATFORM.xMin) / 2,
} as const;

function port(
  id: string,
  stageId: PipelineStageId,
  role: PipelinePortRole,
  pos: [number, number, number],
  label: string
): PipelinePort {
  return { id, stageId, role, pos, label };
}

/**
 * 五大环节之间的全部端口。
 * PipelineScene 的跨环节管路只从这里取坐标；单元文件只从这里取「自身端口」。
 */
export const PIPELINE_PORTS = {
  brine: {
    outlet: port("brine.outlet", "brine", "outlet", [STAGE_X.brine + 5.0, -1.62, 0], "精卤出口"),
  },
  evaporate: {
    brineInlet: port(
      "evaporate.brineInlet",
      "evaporate",
      "inlet",
      [STAGE_X.evaporate - 4.5, -1.5, -0.5],
      "精卤进口（Ⅰ效加热室）"
    ),
    saltOutlet: port(
      "evaporate.saltOutlet",
      "evaporate",
      "outlet",
      [STAGE_X.evaporate + 4.5, -1.25, 0],
      "盐浆出口（Ⅳ效排料）"
    ),
  },
  centrifuge: {
    inlet: port(
      "centrifuge.inlet",
      "centrifuge",
      "inlet",
      [STAGE_X.centrifuge - 2.7, 2.3, 0],
      "盐浆进口（旋流器顶部）"
    ),
    wetOutlet: port(
      "centrifuge.wetOutlet",
      "centrifuge",
      "outlet",
      [STAGE_X.centrifuge, -0.6, 0],
      "湿盐出口"
    ),
  },
  dry: {
    inlet: port("dry.inlet", "dry", "inlet", [STAGE_X.dry - 1.4, -0.1, 0], "湿盐进口（流化床左壁）"),
    outlet: port("dry.outlet", "dry", "outlet", [STAGE_X.dry + 3.0, -0.4, 0], "干盐出口"),
  },
  pack: {
    inlet: port("pack.inlet", "pack", "inlet", [STAGE_X.pack - 2.5, 0.45, 0], "干盐进口（进料漏斗）"),
  },
} as const;

/** 跨环节连接顺序（从左到右的物料流） */
export const STAGE_CONNECTIONS = [
  { from: PIPELINE_PORTS.brine.outlet, to: PIPELINE_PORTS.evaporate.brineInlet },
  { from: PIPELINE_PORTS.evaporate.saltOutlet, to: PIPELINE_PORTS.centrifuge.inlet },
  { from: PIPELINE_PORTS.centrifuge.wetOutlet, to: PIPELINE_PORTS.dry.inlet },
  { from: PIPELINE_PORTS.dry.outlet, to: PIPELINE_PORTS.pack.inlet },
] as const;

const STAGE_ORDER: PipelineStageId[] = ["brine", "evaporate", "centrifuge", "dry", "pack"];

/**
 * 端口表自动校验：
 * - id 唯一
 * - 坐标有限且在平台范围内
 * - 每个环节入/出端口齐全
 * - 连接方向与产线顺序一致、间距合理
 * 返回错误信息数组（空数组表示通过）。
 */
export function validatePipelinePorts(): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const allPorts: PipelinePort[] = [
    PIPELINE_PORTS.brine.outlet,
    PIPELINE_PORTS.evaporate.brineInlet,
    PIPELINE_PORTS.evaporate.saltOutlet,
    PIPELINE_PORTS.centrifuge.inlet,
    PIPELINE_PORTS.centrifuge.wetOutlet,
    PIPELINE_PORTS.dry.inlet,
    PIPELINE_PORTS.dry.outlet,
    PIPELINE_PORTS.pack.inlet,
  ];

  allPorts.forEach((p) => {
    if (seen.has(p.id)) errors.push(`duplicate port id: ${p.id}`);
    seen.add(p.id);
    const [x, y, z] = p.pos;
    if (![x, y, z].every(Number.isFinite)) errors.push(`${p.id}: non-finite coordinate ${p.pos}`);
    if (x < PLATFORM.xMin || x > PLATFORM.xMax) {
      errors.push(`${p.id}: x=${x} outside platform [${PLATFORM.xMin}, ${PLATFORM.xMax}]`);
    }
    if (z < -PLATFORM.depth / 2 || z > PLATFORM.depth / 2) {
      errors.push(`${p.id}: z=${z} outside platform depth ${PLATFORM.depth}`);
    }
  });

  const stagePorts = new Map<PipelineStageId, PipelinePort[]>();
  allPorts.forEach((p) => {
    const arr = stagePorts.get(p.stageId) ?? [];
    arr.push(p);
    stagePorts.set(p.stageId, arr);
  });
  STAGE_ORDER.forEach((stageId) => {
    const ports = stagePorts.get(stageId) ?? [];
    const inlet = ports.find((p) => p.role === "inlet");
    const outlet = ports.find((p) => p.role === "outlet");
    if (stageId !== "brine" && !inlet) errors.push(`${stageId}: missing inlet port`);
    if (stageId !== "pack" && !outlet) errors.push(`${stageId}: missing outlet port`);
  });

  STAGE_CONNECTIONS.forEach(({ from, to }) => {
    const fi = STAGE_ORDER.indexOf(from.stageId);
    const ti = STAGE_ORDER.indexOf(to.stageId);
    if (fi < 0 || ti < 0 || fi >= ti) {
      errors.push(`connection ${from.id} -> ${to.id}: stage order should be increasing`);
    }
    const dx = to.pos[0] - from.pos[0];
    if (dx <= 0) errors.push(`connection ${from.id} -> ${to.id}: flow should move to +x (dx=${dx})`);
    const dist = Math.hypot(
      to.pos[0] - from.pos[0],
      to.pos[1] - from.pos[1],
      to.pos[2] - from.pos[2]
    );
    if (dist <= 0.01) errors.push(`connection ${from.id} -> ${to.id}: ports coincide`);
    if (dist > 12) errors.push(`connection ${from.id} -> ${to.id}: distance ${dist.toFixed(2)} too large`);
  });

  return errors;
}
