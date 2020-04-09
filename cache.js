const path = require('path');
const LZUTF8 = require('lzutf8');
const chokidar = requireOptional('chokidar');

function requireOptional(path){
    try{
        return require(path);
    }catch(e){return undefined;}
}

let cacheDevelopment = false;

function compressStr(str){
    if(!str){return undefined;}
    if(typeof str === 'object' || Array.isArray(str)){try{str = JSON.stringify(str);}catch(e){return null;}}
    try{str = LZUTF8.compress(str, {outputEncoding: 'Base64'});}catch(e){return null;}
    try{str = LZUTF8.compress(str, {outputEncoding: 'StorageBinaryString'});}catch(e){return null;}
    try{str = LZUTF8.compress(str, {outputEncoding: 'Buffer'});}catch(e){return null;}
    return str;
}

function decompressStr(str){
    if(!str){return undefined;}
    if(typeof str === 'object'){try{str = LZUTF8.decompress(str, {inputEncoding: 'Buffer'});}catch(e){return null;}}
    try{str = LZUTF8.decompress(str, {inputEncoding: 'StorageBinaryString'});}catch(e){return null;}
    try{str = LZUTF8.decompress(str, {inputEncoding: 'Base64'});}catch(e){return null;}
    try{str = JSON.parse(str);}catch(e){}
    return str;
}

function getCache(Cache, cacheData, cacheOptions, filePath){
    let cache = Cache.get(filePath);
    if(cache && (new Date().getTime()) <= cache.cache.expire){
        return decompressStr(cache.file);
    }else if(cache){Cache.delete(filePath);}
    return undefined;
}

function setCache(Cache, cacheData, cacheOptions, filePath, data, options){
    if(!cacheDevelopment && process.env.NODE_ENV !== 'production'){return undefined;}
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

function removeCache(Cache, cacheData, cacheOptions, filePath){
    if(Cache.has(filePath)){Cache.delete(filePath);}
}

function clearCache(Cache, cacheData, cacheOptions){
    Cache.clear();
}

function watchFiles(Cache, cacheData, cacheOptions, files){
    if(!chokidar){console.warn('obj-memory-cache Watch requires optional dependency: chokidar. run: npm install chokidar'); return false;}
    function clearCacheFilePath(filePath){clearCacheOnFilePath(Cache, cacheData, cacheOptions, filePath);}
    chokidar.watch(files, {ignoreInitial: true}).on('change', clearCacheFilePath).on('add', clearCacheFilePath).on('unlink', clearCacheFilePath);
}


function cacheCheckInterval(Cache, cacheData, cacheOptions){
    setInterval(function(){
        Cache.forEach((file, filePath) => {
            if(file.cache.expire && (new Date().getTime()) > file.cache.expire){Cache.delete(filePath);}
        });
    }, toTimeMillis('10m'));
}


function clearCacheOnFilePath(Cache, cacheData, cacheOptions, filePath){
    filePath = path.resolve(filePath).toString().replace(/\\/g, '/');
    Cache.forEach((file, path) => {
        if(file.cache.listen){
            let listenFiles = decompressStr(file.cache.listen);
            if(listenFiles.includes(filePath) || listenFiles.find(file => filePath.startsWith(file))){Cache.delete(path);}
        }
    });
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


module.exports = {
    get: getCache,
    set: setCache,
    delete: removeCache,
    clear: clearCache,
    watch: watchFiles,
    checkInterval: cacheCheckInterval,
    cacheDevelopment: function(cache = true){cacheDevelopment = cache;}
};
