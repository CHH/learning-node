# README

## TODO

- [x] Expose public API only through index.js to avoid tight coupling and circular dependencies
- [x] Clean up routing terminology "parameter" vs "var" by moving everything to "parameter"
- [x] Add hierarchical route collections with RouteCollection.mounted()
- [x] Add optional route parameters
- [x] Add redirect and url generator helpers in AppController
- [x] Add querystring parsing to default request matcher and UrlGenerator
- [x] Add extend to Container
- [x] Add App.use() for applying middleware
- [x] Add Route.to() for setting the controller
- [ ] Fix hot reloading for routes and make hot reloading something that usually works for 
      every service that depends on loading a config file
