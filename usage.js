'use strict';
function windows(result) {
  const bucket = result?.rateLimitsByLimitId?.codex ?? result?.rateLimits;
  return [bucket?.primary,bucket?.secondary].filter(w=>w && Number.isFinite(w.usedPercent)).map(w=>({
    remaining:Math.max(0,Math.min(100,Math.floor(100-w.usedPercent))),
    label:w.windowDurationMins===300?'5h':w.windowDurationMins===10080?'7d':Number.isFinite(w.windowDurationMins)?w.windowDurationMins+'m':'Limit',
    reset:Number.isFinite(w.resetsAt)?new Date(w.resetsAt*1000):null
  }));
}
function bar(percent){const n=Math.round(percent/20);return '■'.repeat(n)+'□'.repeat(5-n);}
module.exports={windows,bar};
