/*jshint camelcase: false */
/*global module:false */

module.exports = function(grunt) {

  grunt.initConfig({

    // clean up dist folder
    clean: {
      main: {
        src: ["dist/**/*.*"]
      }
    },

    // copy assets
    copy: {
      main: {
        files: [
          {expand: true, cwd: '.', src: ['flatScroll.js'],     dest: 'dist/'},
          {expand: true, cwd: 'css', src: ['flatScroll.scss'],     dest: 'dist/'}
        ]
      }
    },

    //minify JS
    uglify: {
      options: {
        preserveComments: 'some'
      },
      main: {
        files: {
          'dist/flatScroll.min.js': ['dist/flatScroll.js']
        }
      }
    },

    //minify CSS
    cssmin: {
      main: {
        files: {
          "dist/flatScroll.css": ["css/css.css"]
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-cssmin");


  grunt.registerTask('default', [
    'clean', 'copy', 'uglify', 'cssmin'
  ]);

};