## Object Memory Cache

![npm](https://img.shields.io/npm/v/obj-memory-cache)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/obj-memory-cache)
![GitHub top language](https://img.shields.io/github/languages/top/aspiesoft/obj-memory-cache)
![NPM](https://img.shields.io/npm/l/obj-memory-cache)

![npm](https://img.shields.io/npm/dw/obj-memory-cache)
![npm](https://img.shields.io/npm/dm/obj-memory-cache)
![GitHub last commit](https://img.shields.io/github/last-commit/aspiesoft/obj-memory-cache)

[![paypal](https://img.shields.io/badge/buy%20me%20a%20coffee-paypal-blue)](http://buymeacoffee.aspiesoft.com/)

This cache stores JSON objects, and strings into a javascript MAP.
Objects are stringified before storage, and parsed when retrieved.
Before storage, this module uses another npm module (lzutf8) to compress the string and reduce storage.

When you set a cache, you can tell it to expire any amount of time in the future.
When you get the cache data, the expiation of that item is checked, and removed if expired.
Every 10 minutes, the entire cache is checked for expired items, to remove unused cache items.

You can also watch a file (or directory) for changes, or watch for when a file is added.
When you listen for file changes, the cache items listening for that file change are removed.

Note: listening for file changes requires the chokidar npm module

### Installation

```shell script
npm install obj-memory-cache

# or without optional file watching
npm install obj-memory-cache --no-optional
```

### Setup

```js
const memoryCache = require('obj-memory-cache');

// optional (to watch files for updates) (requires chokidar npm module)
memoryCache({watch: __dirname});
// note: this just sets the root dir to watch, and not the actual files

// by default, the cache is disabled in development, to help with debugging
// to test the cache in development, simply run this function
memoryCache.cacheDevelopment();

// you can also run this function with the false parameter to disable it later
memoryCache.cacheDevelopment(false);
```

### Usage

```js
function getData(){
    let cache = memoryCache.get('myCachePath');
    if(cache){return cache;}
    
    let data = {myJsonData: 'example data'};
    
    memoryCache.set('myCachePath', data, {expire: '10m'}); // 10 minutes
    
    return data;
}

function getFileData(filePath){
    let cache = memoryCache.get(filePath);
    if(cache){return cache;}
    
    let jsonData = require(filePath);
    
    let defaultJsonData = require('default/data/file/path');
    
    let result = {};

    Object.assign(result, defaultJsonData, jsonData);
    
    memoryCache.set(filePath, result, {listen: [filePath, 'default/data/file/path']});
    
    return result;
}
```
