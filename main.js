const cache = require('./src/cache');

const Cache = newCache();

//todo: add memory limit option (to filter out results early) (base on last used, and most used)
//todo: add option to keep separate cache for most common garbed resources (make false option avoid counting) (make number option keep a number of items) (make true option use a default number)

function newCache(options = {}){
	const Cache = new Map();
	const cacheData = {memoryUsage: 0};
	const cacheOptions = options;
	Object.freeze(cacheOptions);
	if(cacheOptions.watch){cache.watch(Cache, cacheData, cacheOptions, cacheOptions.watch);}
	cache.checkInterval(Cache, cacheData, cacheOptions);
	return {
		get: function(filePath){
			return cache.get(Cache, cacheData, cacheOptions, filePath);
		},
		set: function(filePath, data, options){
			return cache.set(Cache, cacheData, cacheOptions, filePath, data, options);
		},
		delete: function(filePath){
			return cache.delete(Cache, cacheData, cacheOptions, filePath);
		},
		clear: function(){
			return cache.clear(Cache, cacheData, cacheOptions);
		},
		watch: function(files){
			return cache.watch(Cache, cacheData, cacheOptions, files);
		},
	};
}

module.exports = (() => {
	let exports = function(options = {}){
		if(options.watch){
			if(options.watch){Cache.watch(options.watch);}
		}
	};
	exports.newCache = newCache;
	exports.get = Cache.get;
	exports.set = Cache.set;
	exports.delete = Cache.delete;
	exports.clear = Cache.clear;
	exports.watch = Cache.watch;
	exports.cacheDevelopment = cache.cacheDevelopment;
	return exports;
})();
