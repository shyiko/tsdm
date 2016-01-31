<p align="center">
  <a href="https://github.com/shyiko/tsdm">
    <img width="168" height="140" src="https://cloud.githubusercontent.com/assets/370176/12692653/0dd7a090-c6af-11e5-90fb-62ffb2b88ca5.png">
  </a>
</p>

[![Build Status](https://travis-ci.org/shyiko/tsdm.svg?branch=master)](https://travis-ci.org/shyiko/tsdm)

No worries TypeScript definition manager.
 
> \* experimental

## Why?
* No dependency on [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) GitHub repo. No PRs to send. No PRs to accept.
* ... and no custom registries either. Everything is in NPM.
* No [fear of hitting GitHub rate-limit](https://github.com/DefinitelyTyped/tsd#i-hit-the-github-rate-limit-now-what).
* No need to commit `typings/**` or [full of opaque hashes](https://github.com/DefinitelyTyped/tsd/blob/master/tsd.json) `tsd.json`.
* No `/// <reference path="..."/>`s all over your code.
* No special `<insert your definition manager>.json`. `package.json` is all you need. 
* Easy version management.
* Nothing to learn. If you know how to use `npm` - you're pretty much all set.

## Installation

```sh
npm install -g tsdm
```

## Usage

For any package that doesn't come with typings
out-of-the-box use `npm` to install external definition (e.g. `npm install --save-dev ...`).
After that - run `tsdm rewire`. That's it.

```sh
npm i retyped/react-tsd#v0.14.6 --save-dev && tsdm rewire
```

> NOTE that `compilerOptions.moduleResolution` have to be set to 
[node](https://github.com/Microsoft/TypeScript/wiki/Typings-for-npm-packages) (in your tsconfig.json)

> Most (if not all) [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) typings are available through [retyped](https://github.com/retyped).
[npmsearch](http://npmsearch.com/?q=keywords:tsd%20keywords:tsd-ambient) is an excellent place to find many more.
  
> If you need a quick way to add declaration for the module that doesn't yet have definition available on `npm` you
can add it to `<project root>/.tsdm.d.ts`. This is meant a temporary solution only. Please consider contributing  missing 
typings back to the community.

**DEMO @** [shyiko/typescript-boilerplate](https://github.com/shyiko/typescript-boilerplate)

## License

[MIT License](https://github.com/shyiko/tsdm/blob/master/mit.license)
