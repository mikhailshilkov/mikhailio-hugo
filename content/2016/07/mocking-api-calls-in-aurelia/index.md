---
title: Mocking API calls in Aurelia
date: 2016-07-27
tags: ["Aurelia", "BrowserSync", "REST", "API"]
thumbnail: teaser.png
---

[Aurelia](http://aurelia.io) is a modern and slick single-page application framework. 
"Single-page application" aspect means that it's loaded
into the browser once, and then the navigation happens on the client side and
all the data are loaded from a REST API endpoint.

Let's say that our front-end Aurelia app is hosted at
`myaureliaapp.com` while the REST API is hosted at
`myaureliaapp.com/api`. The REST API is a server-side application,
which can be implemented in .NET, Java, Node.JS etc., and it talks to
a database of some kinds.

For the front-end development purpose, it's usually useful to be able to
mock the connection to API with some static manually generated data. This
cuts the hard dependency between the client code, the backend code and database.
It's much easier to mock the exact data set which is needed for the current
development task.

Fortunately, it can be easily done, and here is how.

Identify your requests
----------------------

Create a list of the requests that you need to mock. For our example let's
say you do the following requests from the application:

```
GET /api/products
GET /api/products/{id}
POST /api/products
```

Put your mock data into files
-----------------------------

Go to the root folder of your Aurelia app and create an `/api` folder. 

Create a `/api/products` subfolder and put a new file called `GET.json`. This
file should contain the JSON of the product list, e.g.

``` json
[ { "id": 1, "name": "Keyboard", "price": "60$" },
  { "id": 2, "name": "Mouse", "price": "20$" },
  { "id": 3, "name": "Headphones", "price": "80$" }
]
```

Create a new file called `POST.json` in the same folder. POST response won't 
return any data, so the file can be as simple as

``` json
{}
```

Create subfolders `1`, `2` and `3` under `products` and create a `GET.json` 
file in each of them. Every file contains the data for a specific product, e.g.

``` json
{ "id": 1, 
  "name": "Keyboard", 
  "price": "60$",
  "category": "Computer Accessories",
  "brand": "Mousytech"
}
```

Configure BrowserSync to mock your API calls
--------------------------------------------

For the purpose of this post, I assume you are using 
[Aurelia Skeleton Navigation](https://github.com/aurelia/skeleton-navigation)
starter kit, specifically 
[the version with Gulp-based tasks and BrowserSync](https://github.com/aurelia/skeleton-navigation/tree/master/skeleton-esnext).
If so, you should be familiar with `gulp serve` command, which serves your 
application at `http://localhost:9000`. We will extend this command to host
your API mock too.

Navigate to `/build/tasks` folder and edit the `serve.js` file. Change the 
definition of `serve` task to the following code:

``` js
gulp.task('serve', ['build'], function(done) {
  browserSync({
    online: false,
    open: false,
    port: 9000,
    server: {
      baseDir: ['.'],
      middleware: function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Mock API calls
        if (req.url.indexOf('/api/') > -1) {
          console.log('[serve] responding ' + req.method + ' ' + req.originalUrl);
          
          var jsonResponseUri = req._parsedUrl.pathname + '/' + req.method + '.json';
          
          // Require file for logging purpose, if not found require will 
          // throw an exception and middleware will cancel the retrieve action
          var jsonResponse = require('../..' + jsonResponseUri);
          
          // Replace the original call with retrieving json file as reply
          req.url = jsonResponseUri;
          req.method = 'GET';
        }

        next();
      }
    }
  }, done);
});
```

Run it
------

Now just run `gulp serve` (or `gulp watch`, which does `serve` and then watches
files for changes). Every time your app makes an API call, you will see
a line in the gulp console:

```
[serve] responding GET /api/products
```

If you happen to make an invalid request with no mock defined, you will
get an error:

```
[serve] responding GET /api/notproducts
Error: Cannot find module '../../api/notproducts/GET.json'
```

A complete example can be found in 
[my github repository](https://github.com/mikhailshilkov/mikhailio-samples/tree/master/aurelia-api-mocks).