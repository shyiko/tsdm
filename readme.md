# tsdm

**WIP**

(next generation) **T**ype**S**cript **d**eclaration **m**anager. 

## Why?
* No reliance on [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) GitHub repo.   
* No `tsd.json`, `.tsdrc`, etc. 
* No [fear of hitting GitHub rate-limit](https://github.com/DefinitelyTyped/tsd#i-hit-the-github-rate-limit-now-what).
* No need to commit `typings/**` or full of obscure hashes `tsd.json`.
* No wheel re-invention. 
* Sane version management.
* Nothing to learn. If you know how to use `npm` - you're pretty much all set.

## Installation

```sh
npm install tsdm --save-dev
```

## Usage

```sh
# for any package that is missing TypeScript typings install either 
# tsdmjs/<package_name>-tsd or some other module that provies type definitions
# for example:
npm i tsdmjs/react-tsd#v0.14.6 --save
    
# re-generate typings/*
tsdm i
```

> For a complete list of command line options - see `tsdm --help`.

## Demo

**COMMING**

## Recommendations

* Add `typings/tsd.d.ts` to `files` list in `tsconfig.json`.
* Avoid explicit `/// <reference ... />`. `compilerOptions.moduleResolution` 
set to [node](https://github.com/Microsoft/TypeScript/wiki/Typings-for-npm-packages)
\+ `*-tsd` packages are usually all you need.  
 
* Add `typings` to `.gitignore`. There is no need to check it in.

## License

[MIT License](https://github.com/shyiko/tsdm/blob/master/mit.license)
