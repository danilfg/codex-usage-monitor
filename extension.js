'use strict';
const vscode=require('vscode');
const {executable,readLimits}=require('./client');
const {windows,bar,tooltip}=require('./usage');
let stop;
function activate(context){
  const status=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,100);
  status.name='Codex Usage Monitor VS Code';status.command='codexUsageMonitor.refresh';status.text='$(dashboard) Codex …';status.show();
  let pending,timer,disposed=false,lastAttempt=0;
  const config=()=>vscode.workspace.getConfiguration('codexUsageMonitor');
  const interval=()=>Math.max(30,Math.min(600,config().get('refreshSeconds',60)))*1000;
  function schedule(){clearTimeout(timer);if(!disposed)timer=setTimeout(refresh,interval());}
  async function refresh(){
    if(disposed||pending||Date.now()-lastAttempt<5000)return;
    lastAttempt=Date.now();clearTimeout(timer);
    try{
      const official=vscode.extensions.getExtension('openai.chatgpt');
      if(!official)throw new Error('Install official Codex');
      pending=readLimits(executable(official.extensionPath));
      const result=windows(await pending.promise);
      if(disposed)return;
      if(!result.length)throw new Error('No usage windows');
      const lowest=Math.min(...result.map(w=>w.remaining));
      status.backgroundColor=lowest<=10?new vscode.ThemeColor('statusBarItem.errorBackground'):lowest<=25?new vscode.ThemeColor('statusBarItem.warningBackground'):undefined;
      status.text='$(dashboard) Codex '+result.map(w=>w.label+' '+(config().get('showBars',true)?bar(w.remaining)+' ':'')+w.remaining+'%').join(' | ');
      status.tooltip=tooltip(result);
    }catch{
      if(disposed)return;
      status.backgroundColor=undefined;status.text='$(dashboard) Codex N/A';status.tooltip='Usage unavailable. Check official Codex installation and ChatGPT sign-in. Click to retry.';
    }finally{pending=undefined;schedule();}
  }
  stop=()=>{disposed=true;clearTimeout(timer);pending?.cancel();status.dispose();};
  context.subscriptions.push(vscode.commands.registerCommand('codexUsageMonitor.refresh',refresh),vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('codexUsageMonitor'))schedule();}),{dispose:stop});
  void refresh();
}
function deactivate(){stop?.();}
module.exports={activate,deactivate};
