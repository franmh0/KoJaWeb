const fs=require('fs');
const path=require('path');
const sharp=require('C:/Users/Rei_I/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source='D:/Projects/KoJa/Fotos';
const destination=path.join(__dirname,'assets','gallery');
const metadata=JSON.parse(fs.readFileSync(path.join(source,'metadatos_fotos_completo.json'),'utf8'));
const metadataByPath=new Map(metadata.fotos.map(photo=>[photo.ruta_relativa.replaceAll('\\','/'),photo]));
const labels={Salida:'Salida',Seul:'Seúl',Gwanghwamun:'Gwanghwamun',OlympicPark:'Olympic Park',Busan:'Busan',Namsan:'Namsan',Myeongdon:'Myeongdong',Akihabara:'Akihabara',Shibuya:'Shibuya',Asakusa:'Asakusa',Odaiba:'Odaiba',Nagoya:'Nagoya',Arashiyama:'Arashiyama',FushimiInari:'Fushimi Inari',Nara:'Nara',Hiroshima:'Hiroshima',Osaka:'Osaka',Pokemon:'Pokémon',Mitaka:'Mitaka',Descanso:'Día tranquilo',Kamakura:'Kamakura',Roppongi:'Roppongi'};
async function main(){
  fs.mkdirSync(destination,{recursive:true});
  const placeByDay=new Map(fs.readdirSync('D:/Projects/KoJa/Album').filter(x=>/^\d{2}_/.test(x)).map(dir=>{const m=dir.match(/^(\d{2})_+08_(.+)$/);return m?[m[1],labels[m[2]]||m[2].replace(/_/g,' ')]:null}).filter(Boolean));
  const files=[];
  for(const folder of fs.readdirSync(source).sort()){
    const full=path.join(source,folder);
    if(!fs.statSync(full).isDirectory()||folder==='Videos')continue;
    for(const filename of fs.readdirSync(full).filter(f=>/\.(jpe?g|png)$/i.test(f)).sort())files.push({folder,filename,fullPath:path.join(full,filename)});
  }
  const output=[];
  for(let i=0;i<files.length;i++){
    const photo=files[i],day=photo.folder.startsWith('2024-')?photo.folder.slice(-2):null;
    const item=metadataByPath.get(`${photo.folder}/${photo.filename}`);
    const name=`photo-${String(i+1).padStart(4,'0')}.webp`;
    await sharp(photo.fullPath).rotate().resize({width:800,height:800,fit:'inside',withoutEnlargement:true}).webp({quality:62,effort:4}).toFile(path.join(destination,name));
    output.push({src:`assets/gallery/${name}`,date:photo.folder,day,place:day?(placeByDay.get(day)||'Recuerdos del día'):'Sin fecha',country:day&&Number(day)>=10?'Japón':'Corea',filename:photo.filename,datetime:item?.datetime_exif||null});
    if((i+1)%250===0)console.log(`Preparadas ${i+1}/${files.length}`);
  }
  fs.writeFileSync(path.join(__dirname,'album.json'),JSON.stringify(output));
  console.log(`Álbum preparado: ${output.length} fotografías`);
}
main().catch(e=>{console.error(e);process.exit(1)});
