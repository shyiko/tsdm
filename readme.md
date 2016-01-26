# tsdm

Next generation **TypeScript declaration manager** that leverages power of NPM
instead of reinventing the wheel.
  
**(experimental stage)**  

## Why?
* No dependency on [DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) GitHub repo (or custom registries). No PRs to send. No PRs to accept.
* No `tsd.json`, `.tsdrc` for proxy settings that you have already specified for `npm`, etc. 
* No [fear of hitting GitHub rate-limit](https://github.com/DefinitelyTyped/tsd#i-hit-the-github-rate-limit-now-what).
* No need to commit `typings/**` or [full of obscure hashes](https://github.com/DefinitelyTyped/tsd/blob/master/tsd.json) `tsd.json`.
* Sane version management.
* Nothing to learn. If you know how to use `npm` - you're pretty much all set.
* You want to get rid of `/// <reference path="..."/>`s.

## Installation

```sh
npm install -g tsdm
```

## Usage

For any package that doesn't come with `typings`
out-of-the-box `npm install --save-dev` definition provider (module containing `.d.ts` + a few fields in `package.json`, 
like [tsdmjs/react-tsd](https://github.com/tsdmjs/react-tsd)) and run `tsdm rewire`. That's it.

```sh
npm i tsdmjs/react-tsd#v0.14.6 --save-dev && tsdm rewire     
```

> NOTE that `compilerOptions.moduleResolution` have to be set to 
[node](https://github.com/Microsoft/TypeScript/wiki/Typings-for-npm-packages) (in your tsconfig.json)

**DEMO @** [shyiko/typescript-boilerplate](https://github.com/shyiko/typescript-boilerplate)

## License

[MIT License](https://github.com/shyiko/tsdm/blob/master/mit.license)
