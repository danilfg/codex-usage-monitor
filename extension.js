'use strict';
const vscode=require('vscode');
const {executable,readLimits}=require('./client');
const {windows,bar,detailRows}=require('./usage');
let stop;
function activate(context){
  const status=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,100);
  status.name='Codex Usage Monitor VS Code';status.command='codexUsageMonitor.showDetails';status.text='$(dashboard) Codex …';status.show();
  let pending,timer,disposed=false,lastAttempt=0,latest=[],updated,picker;
  status.tooltip=undefined;
  function renderDetails(){
    if(!picker)return;
    picker.placeholder=updated?'Updated: '+updated.toLocaleTimeString():'Waiting for Codex usage…';
    picker.items=latest.length?detailRows(latest):[{label:'Usage unavailable',detail:'Use the refresh button to retry.'}];
    picker.activeItems=[];
  }
  function showDetails(){
    if(picker){picker.hide();return;}
    const view=vscode.window.createQuickPick();
    picker=view;view.title='Codex usage — remaining limits';view.ignoreFocusOut=false;
    view.matchOnDescription=false;view.matchOnDetail=false;
    const refreshButton={iconPath:new vscode.ThemeIcon('refresh'),tooltip:'Refresh usage'};
    view.buttons=[refreshButton];
    const subscriptions=[view.onDidTriggerButton(()=>{void refresh();}),view.onDidAccept(()=>{view.hide();}),view.onDidHide(()=>{if(picker===view)picker=undefined;for(const s of subscriptions)s.dispose();view.dispose();})];
    renderDetails();view.show();
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
      status.backgroundColor=lowest<=10?new vscode.ThemeColor('statusBarItem.errorBackground'):lowest<=25?new vscode.ThemeColor('statusBarItem.warningBackground'):undefined;
      status.text='$(dashboard) Codex '+result.map(w=>w.label+' '+(config().get('showBars',true)?bar(w.remaining)+' ':'')+w.remaining+'%').join(' | ');
      latest=result;updated=new Date();renderDetails();
    }catch{
      if(disposed)return;
      status.backgroundColor=undefined;status.text='$(dashboard) Codex N/A';latest=[];updated=undefined;renderDetails();
    }finally{pending=undefined;schedule();}
  }
  stop=()=>{disposed=true;clearTimeout(timer);pending?.cancel();picker?.hide();status.dispose();};
  context.subscriptions.push(vscode.commands.registerCommand('codexUsageMonitor.showDetails',showDetails),vscode.commands.registerCommand('codexUsageMonitor.refresh',refresh),vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('codexUsageMonitor'))schedule();}),{dispose:stop});
  void refresh();
}
function deactivate(){stop?.();}
module.exports={activate,deactivate};
