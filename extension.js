'use strict';
const vscode=require('vscode');
const {executable,readLimits}=require('./client');
const {windows,bar}=require('./usage');
const {quotaColor,renderCard,documentHtml}=require('./details');
let stop;
function activate(context){
  const status=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,100);
  status.name='Codex Usage Monitor VS Code';status.command='codexUsageMonitor.showDetails';status.text='$(dashboard) Codex …';status.show();
  let pending,timer,disposed=false,lastAttempt=0,latest=[],updated,panel,ready=false;
  status.tooltip=undefined;
  function renderDetails(){
    if(panel&&ready)void panel.webview.postMessage({type:'render',html:renderCard(latest,updated)});
  }
  function showDetails(){
    if(panel){panel.dispose();return;}
    const view=vscode.window.createWebviewPanel('codexUsageMonitor.details','Codex usage',vscode.ViewColumn.Active,{enableScripts:true,localResourceRoots:[],retainContextWhenHidden:false});
    panel=view;ready=false;
    let wasActive=view.active;
    view.onDidDispose(()=>{if(panel===view){panel=undefined;ready=false;}});
    view.onDidChangeViewState(({webviewPanel:p})=>{
      if(p.active)wasActive=true;
      else if(wasActive||!p.visible)p.dispose();
    });
    view.webview.onDidReceiveMessage(message=>{
      if(panel!==view)return;
      if(message?.type==='ready'){ready=true;renderDetails();}
      else if(message?.type==='refresh')void refresh();
      else if(message?.type==='close')view.dispose();
    });
    view.webview.html=documentHtml(latest,updated);
  }
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
      status.backgroundColor=quotaColor(lowest)==='red'?new vscode.ThemeColor('statusBarItem.errorBackground'):quotaColor(lowest)==='amber'?new vscode.ThemeColor('statusBarItem.warningBackground'):undefined;
      status.text='$(dashboard) Codex '+result.map(w=>w.label+' '+(config().get('showBars',true)?bar(w.remaining)+' ':'')+w.remaining+'%').join(' | ');
      latest=result;updated=new Date();renderDetails();
    }catch{
      if(disposed)return;
      status.backgroundColor=undefined;status.text='$(dashboard) Codex N/A';latest=[];updated=undefined;renderDetails();
    }finally{pending=undefined;schedule();}
  }
  stop=()=>{disposed=true;clearTimeout(timer);pending?.cancel();panel?.dispose();status.dispose();};
  context.subscriptions.push(vscode.commands.registerCommand('codexUsageMonitor.showDetails',showDetails),vscode.commands.registerCommand('codexUsageMonitor.refresh',refresh),vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('codexUsageMonitor'))schedule();}),{dispose:stop});
  void refresh();
}
function deactivate(){stop?.();}
module.exports={activate,deactivate};
