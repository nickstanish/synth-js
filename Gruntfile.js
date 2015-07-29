module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    less: {
      development: {
        options: {
            paths: ["./less"],
            yuicompress: true
        },
        files: {
            "./public/stylesheets/style.css": "./public/stylesheets/less/style.less"
        }
      }
    },
    watch: {
      less: {
        files: "./public/stylesheets/less/*",
        tasks: ["less"]
      }
    },
    nodemon: {
      default: {
        script: './bin/www',
        watch: ['app.js']
      }
    },

    concurrent: {
      dev: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');

  grunt.registerTask('default',["less", "concurrent:dev"]);




};