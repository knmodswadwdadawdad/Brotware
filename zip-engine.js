(function(){
'use strict';

function u16(d,o){return d.getUint16(o,true);}
function u32(d,o){return d.getUint32(o,true);}
function decodeName(bytes,utf8){try{return new TextDecoder(utf8?'utf-8':'windows-1252').decode(bytes);}catch(e){return new TextDecoder('utf-8').decode(bytes);}}
function findEocd(bytes){var min=Math.max(0,bytes.length-65557);for(var i=bytes.length-22;i>=min;i--)if(bytes[i]===0x50&&bytes[i+1]===0x4b&&bytes[i+2]===0x05&&bytes[i+3]===0x06)return i;return-1;}
async function inflateRaw(bytes){
  if(typeof DecompressionStream==='undefined')throw new Error('Este navegador não suporta ZIP DEFLATE. Atualize o navegador.');
  var ds=new DecompressionStream('deflate-raw'),stream=new Blob([bytes]).stream().pipeThrough(ds),ab=await new Response(stream).arrayBuffer();return new Uint8Array(ab);
}
async function read(buffer){
  var bytes=buffer instanceof Uint8Array?buffer:new Uint8Array(buffer),dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),eocd=findEocd(bytes);
  if(eocd<0)throw new Error('Arquivo ZIP inválido: diretório central não encontrado.');
  var count=u16(dv,eocd+10),centralSize=u32(dv,eocd+12),centralOffset=u32(dv,eocd+16);
  if(count===0xffff||centralOffset===0xffffffff||centralSize===0xffffffff)throw new Error('ZIP64 ainda não é suportado.');
  var pos=centralOffset,out={},entries=[];
  for(var i=0;i<count;i++){
    if(pos+46>bytes.length||u32(dv,pos)!==0x02014b50)throw new Error('ZIP inválido: entrada central corrompida.');
    var flags=u16(dv,pos+8),method=u16(dv,pos+10),crc=u32(dv,pos+16),compressedSize=u32(dv,pos+20),size=u32(dv,pos+24),nameLen=u16(dv,pos+28),extraLen=u16(dv,pos+30),commentLen=u16(dv,pos+32),localOffset=u32(dv,pos+42);
    var name=decodeName(bytes.slice(pos+46,pos+46+nameLen),!!(flags&0x0800));pos+=46+nameLen+extraLen+commentLen;
    if(!name||/\/$/.test(name))continue;if(flags&1)throw new Error('ZIP protegido por senha não é suportado: '+name);
    if(localOffset+30>bytes.length||u32(dv,localOffset)!==0x04034b50)throw new Error('ZIP inválido: cabeçalho local ausente em '+name);
    var localNameLen=u16(dv,localOffset+26),localExtraLen=u16(dv,localOffset+28),dataStart=localOffset+30+localNameLen+localExtraLen;
    if(dataStart+compressedSize>bytes.length)throw new Error('ZIP truncado em '+name);
    var packed=bytes.slice(dataStart,dataStart+compressedSize),data;
    if(method===0)data=packed;else if(method===8)data=await inflateRaw(packed);else throw new Error('Método de compressão ZIP não suportado ('+method+'): '+name);
    if(size!==0xffffffff&&data.length!==size)console.warn('Tamanho ZIP divergente:',name,size,data.length);
    var path=window.BrotwareVFS?BrotwareVFS.normalizePath(name):name.replace(/^\/+/, '');out[path]=data;entries.push({path:path,method:method,crc:crc,size:data.length,compressedSize:compressedSize});
  }
  return{files:out,entries:entries};
}

var CRC_TABLE=null;
function crcTable(){if(CRC_TABLE)return CRC_TABLE;CRC_TABLE=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);CRC_TABLE[n]=c>>>0;}return CRC_TABLE;}
function crc32(bytes){var c=0xffffffff,t=crcTable();for(var i=0;i<bytes.length;i++)c=t[(c^bytes[i])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function put16(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255;}
function put32(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255;a[o+2]=(v>>>16)&255;a[o+3]=(v>>>24)&255;}
function stamp(d){d=d||new Date();var y=Math.max(1980,d.getFullYear());return{time:(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),date:((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()};}
function concat(parts){var len=0;parts.forEach(function(p){len+=p.length;});var out=new Uint8Array(len),o=0;parts.forEach(function(p){out.set(p,o);o+=p.length;});return out;}
function asBytes(v){if(window.BrotwareVFS)return BrotwareVFS.toUint8(v);if(v instanceof Uint8Array)return v;return new TextEncoder().encode(String(v==null?'':v));}
function write(files){
  var enc=new TextEncoder(),st=stamp(new Date()),names=Object.keys(files||{}).sort(),locals=[],centrals=[],entries=[],offset=0;
  names.forEach(function(path){
    var name=String(path).replace(/\\/g,'/').replace(/^\/+/,''),nb=enc.encode(name),db=asBytes(files[path]),crc=crc32(db),lh=new Uint8Array(30+nb.length);
    put32(lh,0,0x04034b50);put16(lh,4,20);put16(lh,6,0x0800);put16(lh,8,0);put16(lh,10,st.time);put16(lh,12,st.date);put32(lh,14,crc);put32(lh,18,db.length);put32(lh,22,db.length);put16(lh,26,nb.length);put16(lh,28,0);lh.set(nb,30);
    entries.push({name:nb,data:db,crc:crc,offset:offset});locals.push(lh,db);offset+=lh.length+db.length;
  });
  var centralStart=offset;
  entries.forEach(function(e){var ch=new Uint8Array(46+e.name.length);put32(ch,0,0x02014b50);put16(ch,4,20);put16(ch,6,20);put16(ch,8,0x0800);put16(ch,10,0);put16(ch,12,st.time);put16(ch,14,st.date);put32(ch,16,e.crc);put32(ch,20,e.data.length);put32(ch,24,e.data.length);put16(ch,28,e.name.length);put16(ch,30,0);put16(ch,32,0);put16(ch,34,0);put16(ch,36,0);put32(ch,38,0);put32(ch,42,e.offset);ch.set(e.name,46);centrals.push(ch);offset+=ch.length;});
  var centralSize=offset-centralStart,eocd=new Uint8Array(22);put32(eocd,0,0x06054b50);put16(eocd,4,0);put16(eocd,6,0);put16(eocd,8,entries.length);put16(eocd,10,entries.length);put32(eocd,12,centralSize);put32(eocd,16,centralStart);put16(eocd,20,0);
  return new Blob([concat(locals.concat(centrals,[eocd]))],{type:'application/zip'});
}
function findManifest(files){var names=Object.keys(files||{}).filter(function(p){return /(^|\/)brotware\.json$/i.test(p);});names.sort(function(a,b){return a.split('/').length-b.split('/').length||a.length-b.length;});return names[0]||null;}
function findIndex(files){var names=Object.keys(files||{}).filter(function(p){return /(^|\/)index\.html?$/i.test(p);});names.sort(function(a,b){return a.split('/').length-b.split('/').length||a.length-b.length;});return names[0]||null;}

window.BrotwareZip={read:read,write:write,findManifest:findManifest,findIndex:findIndex,crc32:crc32};
})();
