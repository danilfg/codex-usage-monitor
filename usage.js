'use strict';
function windows(result) {
  const buckets=result?.rateLimitsByLimitId ?? result?.rate_limits_by_limit_id;
  const bucket=buckets?.codex ?? Object.values(buckets ?? {}).find(b=>b?.limitId==='codex') ?? result?.rateLimits ?? result?.rate_limits;
  return [bucket?.primary,bucket?.secondary].filter(Boolean).map(w=>{
    const used=w.usedPercent ?? w.used_percent;
    const duration=w.windowDurationMins ?? w.window_minutes;
    const timestamp=w.resetsAt ?? w.resets_at;
    const reset=Number.isFinite(timestamp)&&timestamp>0?new Date(timestamp*1000):null;
    return {remaining:Number.isFinite(used)?Math.max(0,Math.min(100,Math.floor(100-used))):null,
      label:duration===300?'5h':duration===10080?'7d':Number.isFinite(duration)?duration+'m':'Limit',
      reset:reset&&Number.isFinite(reset.getTime())?reset:null};
  }).filter(w=>w.remaining!==null);
}
function bar(percent){const n=Math.round(percent/20);return '■'.repeat(n)+'□'.repeat(5-n);}
function resetLabel(reset,now=new Date(),timeZone){
  if(!(reset instanceof Date)||!Number.isFinite(reset.getTime()))return 'Unavailable';
  const date=new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone,timeZoneName:'short'}).format(reset);
  const mins=Math.ceil((reset.getTime()-now.getTime())/60000);
  if(mins<=0)return date+' (reset expected)';
  const days=Math.floor(mins/1440),hours=Math.floor(mins%1440/60),minutes=mins%60;
  return date+' (in '+[days?days+'d':'',hours?hours+'h':'',minutes||(!days&&!hours)?minutes+'m':''].filter(Boolean).join(' ')+')';
}
function tooltip(windows,now=new Date(),timeZone){
  return ['Codex usage — remaining limits',...windows.flatMap(w=>['', (w.label==='5h'?'5-hour limit':w.label==='7d'?'Weekly limit':w.label)+': '+w.remaining+'% remaining',bar(w.remaining),'Resets: '+resetLabel(w.reset,now,timeZone)]),'','Updated: '+now.toLocaleTimeString(),'Click to refresh'].join('\n');
}
module.exports={windows,bar,resetLabel,tooltip};

function detailRows(windows,now=new Date(),timeZone){
  return windows.map(w=>({
    label:(w.label==='5h'?'5-hour limit':w.label==='7d'?'Weekly limit':w.label)+' — '+w.remaining+'%',
    description:bar(w.remaining),
    detail:'Resets: '+resetLabel(w.reset,now,timeZone)
  }));
}
module.exports.detailRows=detailRows;
