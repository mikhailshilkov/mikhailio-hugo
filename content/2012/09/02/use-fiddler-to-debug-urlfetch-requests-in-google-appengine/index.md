---
title: Use Fiddler to debug urlfetch requests in Google AppEngine
date: 2012-09-02
tags: ["GCP","Debugging","Fiddler","Python"]
description: We use a lot of web crawling to get data from third-party websites. Some crawling is not as easy as just a simple GET request, so we have to send specific POST data, cookies and HTTP headers. And all this needs to be debugged. Fiddler2 is the gold standard for web debugging tools, so I'd like to use it in this case too.
---

In [TripBenefit](http://www.tripbenefit.com "TripBenefit.com - travel in St. Petersburg, Russia") application, we use a lot of web crawling to get data from third-party websites. As the application works on top of Google AppEngine, the [urlfetch.fetch()](https://developers.google.com/appengine/docs/python/urlfetch/fetchfunction?hl=ru "urlfetch.fetch() docs") function is used to send HTTP requests and get responses.

Some crawling is not as easy as just a simple GET request, so we have to send specific POST data, cookies and HTTP headers. And all this needs to be debugged. [Fiddler2](http://www.fiddler2.com "Fiddler2 web debugging tool") is the gold standard for web debugging tools, so I'd like to use it in this case too. I.e. I want to see urlfetch requests displayed in Fiddler, while I'm on development env.**
**

However, to make it work, I have to make AppEngine run all fetch requests through the Fiddler's proxy: localhost:8888. As proxies aren't supported within Google production environment, it's not supported by development engine either. There's simply no such 'proxy' parameter in urlfetch!

It seems that the only way to overcome this limitation is to modify the code of AppEngine development server. It isn't that tricky as it sounds! :)

Stop all your developmenet AppEngine instances. Go to your AppEngine folder, and then to \google\appengine\api\. Edit urlfetch_stub.py (make a backup beforehand). Search for "connection =" line, something like

    if _CONNECTION_SUPPORTS_TIMEOUT:
      connection = connection_class(host, timeout=deadline)
    else:
      connection = connection_class(host)

Substitute it with

    connection = connection_class('127.0.0.1', 8888)

Then, search for "connection.request" method call similar to

    connection.request(method, full_path, payload, adjusted_headers)

and insert another line before it:

    full_path = protocol + "://" + host + full_path

Done! After you run the dev server and Fiddler2, you should be able to see urlfetch requests in web debugger. Have a nice debugging session!