# A script that (almost) ports the editor to a web app located at ../choreo-web.  The copy steps work if
# the destination is a node app of similar structure to this one.  A few steps do not at present lend themselves
# to automation.  They are described in comments.

# TBD: a work in progress, hopefully valuable at least as an inventory of the choreo editor codebase

# remove the main sections of code: controllers, pages, models, styles
rm -r ../choreo-web/app/controllers/choreo
rm -r ../choreo-web/app/html/choreo
rm -r ../choreo-web/app/models/choreo
rm -r ../choreo-web/app/public/css/less/choreo

# remove the text of all supported languages
rm ../choreo-web/app/locales/en/choreo.json
rm ../choreo-web/app/locales/fr/choreo.json

# remove choreo initialization
rm ../choreo-web/config/initializers/50_choreo.js

# now copy the new stuff to these locations

cp -r app/controllers/choreo ../choreo-web/app/controllers
cp -r app/html/choreo ../choreo-web/app/html
cp -r app/models/choreo ../choreo-web/app/models
cp -r app/public/css/less/choreo ../choreo-web/app/public/css/less

cp app/locales/en/choreo.json ../choreo-web/app/locales/en
cp app/locales/fr/choreo.json ../choreo-web/app/locales/fr

cp config/initializers/50_choreo.js ../choreo-web/config/initializers

# TBD: developer must ensure that editor-specific routes from /config/routes.js make it into the web site's 
#      routes file.

# TBD: check _base.less for any generic styles being used by the editor that don't exist on the web site.

# TBD: In piecemeal fashion, the web site should replace some editor "api" routes with its own (e.g. to save
#      a file).  Editor api's should likely remain in /controllers/choreo/api.js (or wherever they end up),
#      since some of them likely can work the same in both contexts.
