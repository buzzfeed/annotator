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
          'dist/build/annotator.css': 'sass/annotator.scss'
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
            'js/annotator.js',
            'js/*/*.js',
            'anon_end'
          ]
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/annotator.min.js': ['dist/build/annotator.js']
        }
      }
    },
    clean: ['dist/build'],
    watch: {
      app: {
        files: ['./sass/*.scss', './js/*.js', './js/*/*.js'],
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
  grunt.loadTasks('libs/grunt-csstojs/tasks');

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