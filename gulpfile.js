const gulp = require('gulp');
const browserSync = require('browser-sync').create();
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const plumber = require('gulp-plumber');
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");


const BASE_PATH = __dirname;
const PROJECT_DIR = ''; // srcの書き出し先がルートではないときに指定 例：xxxxx.com/test/ -> '/test'
const SRC_DIR = `${BASE_PATH}/src`;
const DIST_DIR = `${BASE_PATH}/dist`;
const webpackConfig = require( `${BASE_PATH}/webpack.config` );
const isProduction = process.env.NODE_ENV === 'production';


/**
 * concatするjsライブラリファイル
 */
const jsLibsList = [
  // 'EaselJS/easeljs.min.js',
  // 'PreloadJS/preloadjs-0.6.2.combined.js',
  // 'SoundJS/soundjs-0.6.2.combined.js',
  // 'TweenJS/tweenjs-0.6.2.combined.js'
];

const SRC_PATH = {
  sass: `${SRC_DIR}/scss/**/*.scss`,
  js: [`${SRC_DIR}/js/**/*.js`, `!${SRC_DIR}/js/libs/**/*.js`],
  js_libs: jsLibsList.map(file => `${SRC_DIR}/js/libs/${file}`)
};
const DIST_PATH = {
  sass: `${DIST_DIR}${PROJECT_DIR}/assets/css/`,
  js: `${DIST_DIR}${PROJECT_DIR}/assets/js/`,
  js_libs: `${DIST_DIR}${PROJECT_DIR}/assets/js/libs/`,
  html: `${DIST_DIR}${PROJECT_DIR}/**/*.html`,
};


/**
 * ローカルサーバー
 */
gulp.task('serve', () => {
  browserSync.init({
    server: {
      baseDir: DIST_DIR,
      https: false,
      port: 3000
    }
  });
});


/**
 * jsライブラリの連結
 */
gulp.task('js_libs', () => {
  return gulp.src( SRC_PATH.js_libs )
    .pipe( plumber() )
    .pipe( concat('libs.js') )
    .pipe( uglify({
      output:{
        comments: /^!/ //正規表現でLicenseコメントの頭によくある/*!を検出
      }
    }) )
    .pipe( rename({suffix: '.min'}) )
    .pipe( gulp.dest( DIST_PATH.js_libs ) )
    .pipe( browserSync.stream() );
});


/**
 * sass
 */
gulp.task('sass', function () {
  console.log(isProduction);
  if (isProduction) {
    return gulp.src( SRC_PATH.sass )
      .pipe( plumber({
        errorHandler(err) {
          console.log(err.message);
          this.emit('end');
        }
      }) )
      .pipe( sass({outputStyle: 'compressed'}).on('error', sass.logError) )
      .pipe( autoprefixer(['last 2 versions', 'ie >= 8', 'Android >= 4', 'iOS >= 8']) )
      .pipe( gulp.dest( DIST_PATH.sass ) )
      .pipe( browserSync.stream() );
  }
  else {
    return gulp.src( SRC_PATH.sass )
      .pipe( plumber({
        errorHandler(err) {
          console.log(err.message);
          this.emit('end');
        }
      }) )
      .pipe( sourcemaps.init() )
      .pipe( sass({outputStyle: 'compressed'}).on('error', sass.logError) )
      .pipe( sourcemaps.write() )
      .pipe( sourcemaps.init({loadMaps: true}) )
      .pipe( autoprefixer(['last 2 versions', 'ie >= 8', 'Android >= 4', 'iOS >= 8']) )
      .pipe( sourcemaps.write() )
      .pipe( gulp.dest( DIST_PATH.sass ) )
      .pipe( browserSync.stream() );
  }
});


/**
 * ブラウザリロード
 */
gulp.task('browserReload', function () {
  browserSync.reload();
});


/**
 * ファイル監視
 */
gulp.task('watch', function () {
  gulp.watch( SRC_PATH.sass, ['sass'] );
  gulp.watch( DIST_PATH.html, ['browserReload'] );
});


/**
 * js
 */
gulp.task('js', () => {
  return webpackStream( webpackConfig, webpack )
    .pipe( gulp.dest( DIST_PATH.js ) )
    .pipe( browserSync.stream() );
})



gulp.task('default', ['build']);

gulp.task('build', ['serve', 'watch', 'sass', 'js_libs']);