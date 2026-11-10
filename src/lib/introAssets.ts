/**
 * 首屏揭幕（那张斜切纸面）与首屏关键图加载的单一真相。
 *
 * 用户要的是「用进入网页的动画把加载盖住，图加载完纸才抬开」，同时又不能
 * 一闪就没、也不能让人干等。三条约束决定了这里的形状：
 *
 * 1. **不依赖 React hydration**：整段逻辑是 root layout <head> 里的同步 inline
 *    script（INTRO_HEAD_SCRIPT）。判断「图好了没」只需要 new Image() + decode()，
 *    不需要等 bundle 解析。若等 hydration 才决定抬纸，手机上又会回到
 *    「整屏一块纸、顶栏底栏露着」的老问题。
 * 2. **hold 是加法，不是前提**：脚本一进来给 <html> 写 data-intro-hold，CSS 据此
 *    把揭幕动画 paused 在「盖满」帧；图就绪后移除属性，动画从冻结点继续。
 *    脚本被拦 / JS 禁用 / 报错时属性压根不存在，CSS 动画按默认节奏自己跑完 ——
 *    绝不会把用户永远关在纸后面。
 * 3. **三重放行**：关键图全部 settle、window.load、MAX 硬超时，任一触发即放行；
 *    再加 MIN 最短展示，缓存全命中时也有一拍可读的进场，而不是闪一下。
 * 4. **自动化 / 抓取不挂幕布**：navigator.webdriver（无头浏览器、截图机器人、
 *    部分爬虫）直接跳过 hold，让它们第一眼就看到内容，站内的 40+ 个视觉回归
 *    脚本也无需为了等揭幕逐个改等待时长。真实访客不受影响；揭幕真实时序由
 *    专项脚本覆盖该标志后验证。
 *
 * ⚠ INTRO_LIFT_MS / INTRO_LIFT_DELAY_MS 必须与 globals.css 里
 *   .pt-intro .pt-carriage 的 animation 简写严格对齐（那边无法 import TS）。
 */

import { SITE_THEME_KEY } from "./themePrefs";
import { FLORA_LAYERS } from "@/components/FloraBackdrop";

/** 纸面至少盖这么久：素材命中缓存时也别一闪就没 */
export const INTRO_MIN_MS = 1150;
/** 硬上限：网络再慢也不干等，到点强制抬纸 */
export const INTRO_MAX_MS = 3800;
/** 揭幕：纸面右移出视口的时长（与 CSS 对齐） */
export const INTRO_LIFT_MS = 760;
/** 放行后再起手的定格（与 CSS 对齐） */
export const INTRO_LIFT_DELAY_MS = 140;

/** 本地首屏关键图。按主题 / 视口 / 路由分流，不给档案风用户下载草木素材。 */
const LOCAL_ASSETS = {
  paper: "/images/herbarium/paper-grain.webp",
  sprig: "/images/herbarium/press-1.webp",
  heroDesktop: "/images/hero-botanical.webp",
  heroMobile: "/images/herbarium/hero-portrait.webp",
};
/**
 * 两张花汁底光是远程 Cloudinary 图。只提前发起请求，**不进阻塞清单**：
 * 它们是掩到纸里的虚焦渐变，晚到不破坏版面；若让它们决定揭幕，慢网或
 * 该域不可达时会把用户按在纸后面直到 MAX 超时。INTRO_MIN_MS 那 1.15s
 * 就是给它们留的自然宽限，正常网络下揭幕时它们已经在了。
 */
const FLORA_ASSETS = FLORA_LAYERS.slice(0, 2).map((l) => l.src);

const j = JSON.stringify;

/**
 * root layout <head> 内的同步脚本。只做三件事：写主题、写语言、挂揭幕 hold。
 * 刻意不用可选链 / 箭头函数等新语法：这段要在任何浏览器里都能跑完，
 * 且脚本本身出错时 CSS 仍会自行揭幕。
 */
export const INTRO_HEAD_SCRIPT = `(function(){
var d=document.documentElement;
var THEME=null;try{THEME=localStorage.getItem(${j(SITE_THEME_KEY)})}catch(e){}
if(THEME==='archive'){d.setAttribute('data-theme','archive')}
try{if(localStorage.getItem('diagonal-language')==='en'){d.setAttribute('lang','en')}}catch(e){}
if(navigator.webdriver||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){return}
var MIN=${INTRO_MIN_MS},MAX=${INTRO_MAX_MS},start=Date.now(),called=false,fired=false;
function fire(){if(fired)return;fired=true;d.removeAttribute('data-intro-hold');d.setAttribute('data-intro-ready','1')}
function ready(){if(called)return;called=true;var w=Math.max(0,MIN-(Date.now()-start));if(w){setTimeout(fire,w)}else{fire()}}
d.setAttribute('data-intro-hold','1');
setTimeout(ready,MAX);
if(document.readyState==='complete'){ready()}else{window.addEventListener('load',ready,{once:true})}
var isHerb=THEME!=='archive';
var isHome=location.pathname==='/'||location.pathname.slice(-11)==='/index.html';
var mobile=window.matchMedia?matchMedia('(max-width:640px)').matches:false;
var list=[];
if(isHerb){
  list.push(${j(LOCAL_ASSETS.paper)},${j(LOCAL_ASSETS.sprig)});
  if(isHome){list.push(mobile?${j(LOCAL_ASSETS.heroMobile)}:${j(LOCAL_ASSETS.heroDesktop)})}
  ${j(FLORA_ASSETS)}.forEach(function(src){var a=new Image();a.src=src});
}
var pending=list.length;
if(!pending){ready();return}
list.forEach(function(src){
  var im=new Image(),done=false;
  function settle(){if(done)return;done=true;if(--pending<=0){ready()}}
  im.onload=function(){if(im.decode){im.decode().then(settle,settle)}else{settle()}};
  im.onerror=settle;
  try{im.fetchPriority='high'}catch(e){}
  im.src=src;
  if(im.complete&&im.naturalWidth){settle()}
});
})()`;
