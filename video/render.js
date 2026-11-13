const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const dir=process.argv[2];fs.mkdirSync(dir+'/frames',{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1414}});
p.on('pageerror',e=>{console.error('PAGEERR',e.message)});
await p.goto('file://'+path.join(dir,'scene.html'));
const total=await p.evaluate(()=>window.TOTAL);
for(let f=0;f<total;f++){const d=await p.evaluate(f=>window.render(f),f);
fs.writeFileSync(`${dir}/frames/${String(f).padStart(4,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'));}
console.log('frames',total);await b.close()})();
