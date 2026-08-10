// 全站工艺数据的类型定义

/** 工艺参数项（带来源与可信度标注） */
export interface ParamItem {
  /** 参数名（中文） */
  name: string;
  /** 参数名（英文） */
  nameEn: string;
  /** 数值/范围（字符串，保留单位与符号） */
  value: string;
  /** 单位 */
  unit?: string;
  /** 来源说明 */
  source: string;
  /** 是否为参考值（科学严谨性标注） */
  indicative?: boolean;
}

/** 设备部件说明 */
export interface PartInfo {
  id: string;
  name: string;
  nameEn: string;
  /** 部件功能/原理简述（中文） */
  desc: string;
  /** 部件功能/原理简述（英文） */
  descEn: string;
  /** 材质或关键属性 */
  material?: string;
}

/** 化学反应式条目 */
export interface ReactionItem {
  id: string;
  title: string;
  /** 反应式（纯文本，前端用等宽字体展示） */
  equation: string;
  note: string;
  /** 反应备注（英文） */
  noteEn: string;
}

/** 单个工艺环节的数据 */
export interface StageData {
  id: string;
  index: number;
  /** 环节名（中文） */
  name: string;
  /** 环节名（英文） */
  nameEn: string;
  /** 一句话定位（中文） */
  tagline: string;
  /** 一句话定位（英文） */
  taglineEn: string;
  /** 科学原理（多段，中文） */
  principle: string[];
  /** 科学原理（多段，英文） */
  principleEn: string[];
  /** 关键参数 */
  params: ParamItem[];
  /** 设备部件 */
  parts: PartInfo[];
  /** 化学反应（若有） */
  reactions?: ReactionItem[];
  /** 物料入口（中文） */
  input: string;
  /** 物料入口（英文） */
  inputEn: string;
  /** 物料出口（中文） */
  output: string;
  /** 物料出口（英文） */
  outputEn: string;
  /** 引导式巡游讲解词（中文） */
  tour?: string;
  /** 引导式巡游讲解词（英文） */
  tourEn?: string;
  /** 配色主题（对应 tailwind 色） */
  accent: "steel" | "ember" | "ok" | "warn" | "salt";
}

/** 全站参考资料条目 */
export interface ReferenceItem {
  title: string;
  titleEn: string;
  url?: string;
  note: string;
  noteEn: string;
}
