module.exports = function(grunt) {

  grunt.initConfig({
   shell: {
      yarnForjQuery: {
        command: 'cd node_modules/jquery && yarn install'
      },
      buildCustomjQuery: {
        command: 'cd node_modules/jquery && grunt custom:-sizzle,-ajax,-effects,-deprecated,-manipulation/_evalUrl,-event/alias,-event/focusin,-event/trigger,-core/ready,-deferred,-exports/global,-exports/amd'
      }
    },
    sass: {
      options: {
        sourcemap: "none"
      },
      dist: {
        files: {
          'dist/build/annotator.css': 'engine/sass/annotator.scss'
        }
      }
    },
    cssmin: {
      options: {
        sourceMap: false
      },
      dist: {
        files: {
          'dist/build/annotator.min.css': ['dist/build/annotator.css']
        }
      }
    },
    csstojs: {
      options: {
        varName: 'annotatorInlineStyle',
      },
      dist: {
        files: {
          'dist/build/style.js': ['dist/build/annotator.min.css'],
        }
      }
    },
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        nonull: true,
        options: {
          banner: "(function() {\n",
          footer: "\n})();"
        },
        files: {
          'dist/build/annotator.js': [
            'node_modules/jquery/dist/jquery.min.js',
            'dist/build/style.js',
            'engine/js/annotator.js',
            'engine/js/*/*.js',
            'anon_end'
          ]
        }
      }
    },
    uglify: {
      options: {
        compress: {
          drop_console: true
        },
        banner: "/*! <%= pkg.name %> - built <%= grunt.template.today('dddd, mmmm dS, yyyy, h:MM:ss TT') %> \n" +
        "MIT Licensed, source available at <%= pkg.homepage %> */ \n\n"
      },
      dist: {
        files: {
          'dist/annotator.min.js': ['dist/build/annotator.js']
        }
      }
    },
    clean: ['dist/build'],
    watch: {
      app: {
        files: ['./engine/*/*.js'],
        tasks: ['sass', 'cssmin', 'csstojs', 'concat', 'uglify', 'clean'],
      }
    }
  });

  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadTasks('grunt');

  grunt.registerTask('default', [
    'shell:yarnForjQuery', 
    'shell:buildCustomjQuery', 
    'sass', 
    'cssmin', 
    'csstojs', 
    'concat', 
    'uglify', 
    'clean', 
    'watch'
  ]);

};