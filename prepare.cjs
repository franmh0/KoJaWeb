const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/Rei_I/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = 'D:/Projects/KoJa/Album';
async function main() {
  const days = fs.readdirSync(root).filter(x => /^\d{2}_/.test(x) && !/^9/.test(x)).sort().flatMap(dir => {
    const files=fs.readdirSync(path.join(root,dir)).filter(x=>/\.jpe?g$/i.test(x)).sort();
    return files.map(file=>({dir,file}));
  });
  const selected=Array.from({length:100},(_,i)=>days[Math.round(i*(days.length-1)/99)]);
  const photos=[];
  for(const [i,{dir,file}] of selected.entries()){
    const name=`memory-${String(i+1).padStart(3,'0')}.webp`;
    await sharp(path.join(root,dir,file)).rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toFile(path.join('assets',name));
    photos.push({src:'assets/'+name,day:dir.slice(0,2),place:dir.replace(/^\d+_+08_/,'').replace(/_/g,' ')});
  }
  fs.writeFileSync('photos.json',JSON.stringify(photos,null,2));
  for(const file of fs.readdirSync('assets').filter(x=>x.endsWith('.jpg'))) await sharp(path.join('assets',file)).rotate().resize({width:1800,height:1800,fit:'inside'}).webp({quality:85}).toFile(path.join('assets',file.replace('.jpg','.webp')));
  console.log(`${photos.length} fotografías optimizadas`);
}
main().catch(e=>{console.error(e);process.exit(1)});
