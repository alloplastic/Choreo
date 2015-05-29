# Choreo

## Overview
Choreo is an open-source visual tool for creating games and software.  Aimed at "casual" software development (students, hobbyists, tinkerers), it nonetheless supports the creation of "real" applications, distributable online or in executable form, across many devices.

This project seeks to close the gap between "easy" introductions to programming and professional software development.  Visual tools almost always get in programmers' way, but projects like MIT's Scratch and UC Berkeley's BYOB show that programming environments can be visual without sacrificing expressiveness.  Initially a tool for education and game development, over time we hope Choreo evolves into a more sophisticated way of assembling software applications and services.  In 2050, will we still be building software by typing curly braces into a text editor?

## Contributing

This codebase will be the Wild West until the full skeleton is in place, but we'll ultimately be very interested in getting help in particular with adding core capabilities to the user's toolkit.  We're calling these "kits," actually.  One kit might provide access to a 2D game engine, while another might let the user construct web services and data structures.  The tool will only become truly usable when it can serve a wide range of needs.

In the meantime, feel free to check out the code and look for opportunities to improve things.  Since it's a Node app, you need to:

```
     git clone
     npm install
     node app/app
```

The app should then be accessable at localhost:3000.

## Building and Running

See app/app.js for a number of command-line options, including production mode, clustering, port selection, and so on.

These npm scripts provide a couple of shortcuts.

```
npm start
```

Run in production mode.

```
npm test
```

Run in development mode.

Creating production web builds or native apps is done via grunt.

```
grunt nodewebkit [--platform 'win32', 'win64', 'osx32', 'osx64', 'linux32', 'linux64']
```

Builds a platform-specific exectuble of the app, at ../builds/...  An arbitrary list of platforms can be provided (I think).  Have so far tested only on Mac.

```
grunt build
```
Compiles & minifies LESS, CSS, and Javascript, putting the result in "dist" folders.

```
grunt watch
```
Auto-recompiles LESS files when they change.

