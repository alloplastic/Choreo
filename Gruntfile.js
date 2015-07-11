module.exports = function (grunt) {

	var jsSrc = grunt.file.readJSON("app/public/js/sjs/index.js").sjsFiles;
	var platform =grunt.option("platform");
	platform = platform ? platform : "osx";

	grunt.loadNpmTasks('grunt-node-webkit-builder');

	grunt.initConfig({

		pkg: grunt.file.readJSON("package.json"),

		// Development (+ build) tasks

		 less: {
			 development: {
				 options: {
					 paths: ["assets/css"]
				 },
				 files: {"path/to/result.css": "path/to/source.less"}
			 },
			 production: {
				 options: {
					 paths: ["assets/css"],
					 cleancss: true
				 },
				 files: {"app/public/css/main.css": "app/public/css/less/index.less"}
			 }
		 },
		concat: {
			dev: {
				files: {
					"app/public/js/main.js": jsSrc
				}
			}
		},
		watch: {
			css: {
				files: ["app/public/css/less/**/*.less"],
				tasks: ["less"],
				options: {
					interrupt: true,
					livereload: true
				}
			},
			scripts: {
				files: jsSrc,
				tasks: ["concat"],
				options: {
					interrupt: true,
					livereload: true
				}
			}
		},


		// Build tasks
		clean: {
			dist: ["app/public/css-dist/", "app/public/js-dist/"]
		},
		copy: {
			dist: {
				files: [
					{expand: true, cwd: "app/public/css/img/", src: ["**"], dest: "app/public/css-dist/img/"},
					{expand: true, cwd: "app/public/js/lib/", src: ["**"], dest: "app/public/js-dist/lib/"} // Includes files in path and its subdirs
				]
			}
		},
		cssmin: {
			options: {
				banner: "/*! <%= pkg.name %> v<%= pkg.version %> (<%= grunt.template.today('dd-mm-yyyy') %>) */\n"
			},
			dist: {
				files: [
					{expand: true, cwd: "app/public/css/", src: ["**/*.css"], dest: "app/public/css-dist/"} // Includes files in path and its subdirs
				]
			}
		},
		uglify: {
			options: {
				banner: "/*! <%= pkg.name %> v<%= pkg.version %> (<%= grunt.template.today('dd-mm-yyyy') %>) */\n"
			},
			dist: {
				files: [
					{expand: true, cwd: "app/public/js/", src: ["*.js"], dest: "app/public/js-dist/", filter: "isFile"}, // Includes files in path
					{expand: true, cwd: "app/public/js/page/", src: ["*.js"], dest: "app/public/js-dist/page/", filter: "isFile"} // Includes files in path and its subdirs
				]
			}
		},

		nodewebkit: {
			options: {
				platforms: ["osx64"],
				buildDir: '../builds/choreo-editor/webkitbuilds', // Where the build version of my node-webkit app is saved
				version: 'v0.12.0',
				"node-main": "app/nwboot.js",
				"window": {
					"frame": true,
					"toolbar": true
				},
				"platformOverrides": {
					"win": {
						"window": {
							"frame": true
						}
					}
				}
			
			},
			src: ['./**/*']
		},

		// Configure a mochaTest task
		mochaTest: {
			test: {
				options: {
					reporter: 'spec',
				},
				src: ['test/**/*.js']
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-mocha-test");

	grunt.registerTask("default", ["less", "concat", "watch"]);
	grunt.registerTask("build", ["less", "concat", "clean", "copy", "cssmin", "uglify"]);
	grunt.registerTask("test", ["mochaTest"]);

};
