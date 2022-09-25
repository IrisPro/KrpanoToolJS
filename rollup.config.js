'use strict';
const path = require('path');
const liveServer = require('rollup-plugin-live-server');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const typescript = require('rollup-plugin-typescript2');
const sourceMaps = require('rollup-plugin-sourcemaps');
const workerLoader = require('rollup-plugin-web-worker-loader');
const pkg = require('./package.json');
import {terser} from 'rollup-plugin-terser';

const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];

const moduleName = pkg.name.split('/').pop().replace(/-/g, '');
const config = [];

if (process.env.TARGET === 'debug') {
    config.push({
        input: [path.resolve(__dirname, pkg.entry)],
        output: {
            file: path.resolve(__dirname, pkg.iife),
            format: 'umd',
            name: moduleName,
            sourcemap: true,
        },
        plugins: [
            resolve({
                extensions,
                browser: true,
                preferBuiltins: true,
            }),
            commonjs(),
            workerLoader(),
            typescript({
                typescript: require('typescript'),
                cacheRoot: path.resolve(__dirname, '.rts2_cache'),
            }),
            liveServer({
                port: 8990,
                host: '0.0.0.0',
                root: 'www',
                file: 'index.html',
                mount: [['/dist/iife', './dist/iife']],
                open: false,
                wait: 500,
            }),
        ],
    });
} else {
    /* ESNext */
    config.push({
        input: [path.resolve(__dirname, pkg.entry)],
        output: {
            file: path.resolve(__dirname, pkg['module']),
            format: 'esm',
            sourcemap: false,
        },
        plugins: [
            resolve({
                extensions,
                browser: true,
                preferBuiltins: true,
            }),
            commonjs(),
            workerLoader(),
            typescript({
                typescript: require('typescript'),
                cacheRoot: path.resolve(__dirname, '.rts2_cache'),
                clean: true,
            }),
            terser(),
            sourceMaps(),
        ],
    });
}

module.exports = config;
