'use strict';
const {resetLabel}=require('./usage');
const {randomBytes}=require('node:crypto');
const COLORS={green:'#79c582',amber:'#e3a536',red:'#f16b70'};
function quotaColor(percent){return percent<=20?'red':percent<=50?'amber':'green';}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderCard(windows,updated,now=new Date(),timeZone){
  const sections=windows.filter(w=>Number.isFinite(w.remaining)).map(w=>{
    const percent=Math.max(0,Math.min(100,Math.floor(w.remaining)));
    const title=w.label==='5h'?'5-hour limit':w.label==='7d'?'Weekly limit':w.label;
    const label=resetLabel(w.reset,now,timeZone);
    const parts=/^(.*) \((.*)\)$/.exec(label);
    const date=parts?parts[1]:label;
    const countdown=parts?parts[2]:'';
    return '<section style="--quota:'+COLORS[quotaColor(percent)]+'"><div class="heading"><strong>'+escapeHtml(title)+'</strong><strong class="percent">'+percent+'%</strong></div><div class="track" role="progressbar" aria-label="'+escapeHtml(title)+' remaining" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100"><div class="fill" style="width:'+percent+'%"></div></div><div class="date">Resets: '+escapeHtml(date)+'</div>'+(countdown?'<div class="countdown">'+escapeHtml(countdown.charAt(0).toUpperCase()+countdown.slice(1))+'</div>':'')+'</section>';
  }).join('');
  return (sections||'<section>Usage unavailable. Refresh to retry.</section>')+'<footer><span>'+(updated?'Updated: '+escapeHtml(updated.toLocaleTimeString()):'Not updated yet')+'</span><button id="refresh" type="button">Refresh</button></footer>';
}
function documentHtml(windows,updated){
  const nonce=randomBytes(18).toString('hex');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'nonce-'+nonce+'\';"><style>'+
    '*{box-sizing:border-box}body{margin:0;padding:24px 16px;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);font-family:var(--vscode-font-family,system-ui);font-size:14px}.card{width:100%;max-width:640px;margin:0 auto;background:var(--vscode-editorWidget-background,#242424);border:1px solid var(--vscode-editorWidget-border,#555);border-radius:10px;padding:18px}header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-bottom:18px;font-size:16px;font-weight:600}section{border-top:1px solid var(--vscode-editorWidget-border,#555);padding:20px 0 18px}.heading{display:flex;justify-content:space-between;align-items:center;font-size:16px}.percent{color:var(--quota)}.track{background:var(--vscode-scrollbarSlider-background,#444);height:8px;border-radius:8px;overflow:hidden;margin:12px 0 10px}.fill{height:100%;background:var(--quota);border-radius:8px;transition:width .25s,background .25s}.date,.countdown{line-height:1.8}.countdown,footer{color:var(--vscode-descriptionForeground,#bbb)}footer{border-top:1px solid var(--vscode-editorWidget-border,#555);padding-top:16px;display:flex;justify-content:space-between;align-items:center;gap:12px}button{cursor:pointer;color:var(--vscode-button-foreground);background:var(--vscode-button-background);border:0;border-radius:4px;padding:5px 10px;font:inherit}button:hover{background:var(--vscode-button-hoverBackground)}#close{background:transparent;color:inherit;font-size:20px;padding:0 6px}</style></head><body><main class="card" aria-label="Codex usage"><header>Codex usage — remaining limits<button id="close" aria-label="Close details" type="button">×</button></header><div id="content">'+renderCard(windows,updated)+'</div></main><script nonce="'+nonce+'">const api=acquireVsCodeApi();document.addEventListener("click",e=>{if(e.target.id==="refresh")api.postMessage({type:"refresh"});else if(e.target.id==="close"||!e.target.closest(".card"))api.postMessage({type:"close"});});document.addEventListener("keydown",e=>{if(e.key==="Escape")api.postMessage({type:"close"});});window.addEventListener("message",e=>{if(e.data&&e.data.type==="render"&&typeof e.data.html==="string")document.getElementById("content").innerHTML=e.data.html;});api.postMessage({type:"ready"});</script></body></html>';
}
module.exports={quotaColor,renderCard,documentHtml};

function hoverBar(percent){
  const p=Math.max(0,Math.min(100,Math.floor(percent)));
  const color=COLORS[quotaColor(p)];
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="280" height="8" viewBox="0 0 280 8"><rect width="280" height="8" rx="4" fill="#808080" fill-opacity=".28"/><rect width="'+(280*p/100)+'" height="8" rx="4" fill="'+color+'"/></svg>';
  return 'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64');
}
function hoverMarkdown(windows,updated,now=new Date(),timeZone){
  const rows=windows.filter(w=>Number.isFinite(w.remaining)).map(w=>{
    const p=Math.max(0,Math.min(100,Math.floor(w.remaining)));
    const title=w.label==='5h'?'5-hour limit':w.label==='7d'?'Weekly limit':'Other limit';
    const label=resetLabel(w.reset,now,timeZone);
    const parts=/^(.*) \((.*)\)$/.exec(label);
    const dot=quotaColor(p)==='green'?'🟢':quotaColor(p)==='amber'?'🟠':'🔴';
    return '**'+title+' — '+dot+' '+p+'%**\n\n![Remaining '+p+'%]('+hoverBar(p)+'|width=280,height=8)\n\nResets: '+(parts?parts[1]:label)+(parts?'  \n'+parts[2].charAt(0).toUpperCase()+parts[2].slice(1):'');
  });
  return ['**Codex usage — remaining limits**',...(rows.length?rows:['Usage unavailable. Click to open details.']),updated?'Updated: '+updated.toLocaleTimeString()+' · Click for details':'Click for details'].join('\n\n---\n\n');
}
module.exports.hoverBar=hoverBar;
module.exports.hoverMarkdown=hoverMarkdown;
