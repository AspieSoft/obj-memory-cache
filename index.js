// In God We Trust

const path = require('path');
LZUTF8 = require('lzutf8');
const chokidar = requireOptional('chokidar');

function requireOptional(path){
    try{
        return require(path);
    }catch(e){return undefined;}
}

const Cache = new Map();

let cacheDevelopment = false;

function compressStr(str){
    if(!str){return undefined;}
    if(typeof str === 'object' || Array.isArray(str)){try{str = JSON.stringify(str);}catch(e){return null;}}
    try{return LZUTF8.compress(str, {outputEncoding: 'StorageBinaryString'});}catch(e){return null;}
}

function decompressStr(str){
    if(!str){return undefined;}
    try{str = LZUTF8.decompress(str, {inputEncoding: 'StorageBinaryString'});}catch(e){return null;}
    try{str = JSON.parse(str);}catch(e){}
    return str;
}

function getCache(filePath){
    let cache = Cache.get(filePath);
    if(cache && (new Date().getTime()) <= cache.cache.expire){
        return decompressStr(cache.file);
    }else if(cache){Cache.delete(filePath);}
    return false;
}

function setCache(filePath, data, options){
    if(!cacheDevelopment && process.env.NODE_ENV !== 'production'){return false;}
    if(!Cache.has(filePath)){
        data = compressStr(data);
        if(!data){return;}
        let cacheData = {};
        if(options && (options.expire || options.exp)){cacheData.expire = (new Date().getTime())+toTimeMillis(options.expire || options.exp);}
        if(options && options.listen){
            if(!Array.isArray(options.listen)){options.listen = [options.listen];}
            options.listen = options.listen.map(filePath => {
                return path.resolve(filePath).toString().replace(/\\/g, '/');
            });
            options.listen = compressStr(options.listen);
            cacheData.listen = options.listen;
        }
        Cache.set(filePath, {file: data, cache: cacheData});
    }
}

setInterval(function(){
    Cache.forEach((file, filePath) => {
        if(file.cache.expire && (new Date().getTime()) > file.cache.expire){Cache.delete(filePath);}
    });
}, toTimeMillis('10m'));


function clearCacheOnFilePath(filePath){
    filePath = path.resolve(filePath).toString().replace(/\\/g, '/');
    Cache.forEach((file, path) => {
        if(file.cache.listen){
            let listenFiles = decompressStr(file.cache.listen);
            if(listenFiles.includes(filePath) || listenFiles.find(file => filePath.startsWith(file))){Cache.delete(path);}
        }
    });
}

function watchFiles(files){
    if(!chokidar){console.warn('Watch requires optional dependency: chokidar'); return false;}
    chokidar.watch(files, {ignoreInitial: true}).on('change', clearCacheOnFilePath).on('add', clearCacheOnFilePath).on('unlink', clearCacheOnFilePath);
}


function toNumber(str){
    if(typeof str === 'number'){return str;}
    return Number(str.replace(/[^0-9.]/g, '').split('.', 2).join('.'));
}

function toTimeMillis(str){
    if(typeof str === 'number'){return Number(str);}
    if(!str || typeof str !== 'string' || str.trim() === ''){return NaN;}
    if(str.endsWith('h')){
        return toNumber(str)*3600000;
    }else if(str.endsWith('m')){
        return toNumber(str)*60000;
    }else if(str.endsWith('s')){
        return toNumber(str)*1000;
    }else if(str.endsWith('D')){
        return toNumber(str)*86400000;
    }else if(str.endsWith('M')){
        return toNumber(str)*2628000000;
    }else if(str.endsWith('Y')){
        return toNumber(str)*31536000000;
    }else if(str.endsWith('DE')){
        return toNumber(str)*315360000000;
    }else if(str.endsWith('C') || this.endsWith('CE')){
        return toNumber(str)*3153600000000;
    }else if(str.endsWith('ms')){
        return toNumber(str);
    }else if(str.endsWith('us') || this.endsWith('mic')){
        return toNumber(str)*0.001;
    }else if(str.endsWith('ns')){
        return toNumber(str)*0.000001;
    }
    return toNumber(str);
}


module.exports = (() => {
    let exports = function(options){
        if(options.watch){watchFiles(options.watch);}
    };
    exports.get = getCache;
    exports.set = setCache;
    exports.watch = watchFiles;
    exports.cacheDevelopment = function(cache = true){cacheDevelopment = cache;};
    return exports;
})();
