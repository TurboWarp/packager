# p4

https://packager-staging-do-not-use.turbowarp.org/

We're rewriting the packager again. This is the last time, I promise.

Goals for this rewrite:

 - Smaller projects
 - Faster projects
 - Increased customizability
 - Stop writing interfaces in vanilla JS
 - Use standard Scratch libraries (no branches or forks)

Setup:

```
npm ci
npm start
```

Sometimes for development it can be nice to store NW.js locally, so that you don't have to constantly download it.

```
node download-large-assets-locally.js
LARGE_ASSET_BASE=./ npm start
```

License: GNU Lesser General Public License version 3
