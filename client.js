'use strict';
const {spawn}=require('node:child_process');
const readline=require('node:readline');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
function executable(extensionPath){
  const name=process.platform==='win32'?'codex.exe':'codex';
  const root=fs.realpathSync(extensionPath);
  const target=({darwin:'apple-darwin',linux:'unknown-linux-musl',win32:'pc-windows-msvc'})[process.platform];
  const arch=({arm64:'aarch64',x64:'x86_64'})[process.arch];
  const candidates=[path.join('bin',process.platform+'-'+process.arch,name),path.join('bin',name),path.join('resources',name)];
  if(target&&arch)candidates.push(path.join('vendor',arch+'-'+target,'codex',name),path.join('bin',arch+'-'+target,name));
  // Recent official builds place the executable in a versioned platform bundle.
  try {
    for (const entry of fs.readdirSync(path.join(root,'bin'),{withFileTypes:true})) {
      if (!entry.isDirectory()) continue;
      const dir=path.join('bin',entry.name);
      try {
        const manifest=fs.realpathSync(path.join(root,dir,'codex-package.json'));
        if (!manifest.startsWith(root+path.sep)) continue;
        const pkg=JSON.parse(fs.readFileSync(manifest,'utf8'));
        if (pkg.target!==arch+'-'+target || typeof pkg.entrypoint!=='string') continue;
        candidates.unshift(path.join(dir,pkg.entrypoint),path.join(dir,path.basename(pkg.entrypoint)),path.join(dir,name));
      } catch {}
    }
  } catch {}
  for(const relative of candidates){
    try{
      const p=fs.realpathSync(path.join(root,relative));
      if(!p.startsWith(root+path.sep)||!fs.statSync(p).isFile())continue;
      fs.accessSync(p,fs.constants.X_OK);return p;
    }catch{}
  }
  throw new Error('Bundled Codex executable not found');
}
function readLimits(binary){
  let cancel;
  const promise=new Promise((resolve,reject)=>{
    const child=spawn(binary,['app-server','--listen','stdio://'],{cwd:os.homedir(),shell:false,windowsHide:true,stdio:['pipe','pipe','ignore']});
    const lines=readline.createInterface({input:child.stdout});
    let done=false,stage=0;
    const timer=setTimeout(()=>finish(new Error('Timeout')),15000);
    function finish(error,value){
      if(done)return;done=true;clearTimeout(timer);lines.close();child.stdin.destroy();child.kill();error?reject(error):resolve(value);
    }
    cancel=()=>finish(new Error('Cancelled'));
    const send=msg=>{if(!done)child.stdin.write(JSON.stringify(msg)+'\n');};
    child.on('error',()=>finish(new Error('Launch failed')));
    child.on('exit',()=>finish(new Error('Codex exited')));
    child.stdin.on('error',()=>finish(new Error('Connection closed')));
    lines.on('line',line=>{
      if(done)return;
      let m;try{m=JSON.parse(line);}catch{return;}
      if(stage===0&&m.id===1){
        if(m.error||!m.result)return finish(new Error('Initialization rejected'));
        stage=1;send({method:'initialized'});send({id:2,method:'account/rateLimits/read'});
      }else if(stage===1&&m.id===2){
        if(m.error||!m.result)return finish(new Error('Usage rejected'));
        finish(null,m.result);
      }
    });
    send({id:1,method:'initialize',params:{clientInfo:{name:'danilfg_usage_monitor',title:'Codex Usage Monitor VS Code',version:'0.1.4'}}});
  });
  return {promise,cancel:()=>cancel?.()};
}
module.exports={executable,readLimits};
