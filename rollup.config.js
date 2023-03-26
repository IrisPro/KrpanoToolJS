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
import babel from '@rollup/plugin-babel'
import { DEFAULT_EXTENSIONS } from '@babel/core'

const extensions = [
    '.js', '.jsx', '.ts', '.tsx',
];

const moduleName = 'KrpanoTool'
const config = [];

if (process.env.TARGET === 'debug') {
    config.push({
        input: [path.resolve(__dirname, pkg.entry)],
        output: {
            file: path.resolve(__dirname, pkg.umd),
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
            typescript({
                typescript: require('typescript'),
                cacheRoot: path.resolve(__dirname, '.rts2_cache'),
            }),
            workerLoader(),
            babel({
                babelHelpers: 'runtime',
                exclude: [
                    'node_modules/**',
                    'src/modules/panoToCube/panoToCubeWorker.js'
                ],
                extensions: [
                    ...DEFAULT_EXTENSIONS,
                    '.ts',
                ],
            }),
            liveServer({
                port: 8990,
                host: '0.0.0.0',
                root: 'www',
                file: 'index.html',
                mount: [['/dist', './dist']],
                open: false,
                wait: 500,
            }),
        ],
    });
} else {
    config.push({
        input: [path.resolve(__dirname, pkg.entry)],
        output: [
            // esm
            {
                file: path.resolve(__dirname, pkg['module']),
                name: moduleName,
                format: 'es',
            },
            // cjs
            {
                file: path.resolve(__dirname, pkg['main']),
                name: moduleName,
                format: 'cjs',
            },
            // umd
            {
                name: moduleName,
                format: 'umd',
                file: path.resolve(__dirname, pkg['umd'])
            },
            // iife
            {
                name: moduleName,
                file: path.resolve(__dirname, pkg['iife'])
            }
        ],
        plugins: [
            resolve({
                extensions,
                browser: true,
                preferBuiltins: true,
            }),
            commonjs(),
            typescript({
                typescript: require('typescript'),
                cacheRoot: path.resolve(__dirname, '.rts2_cache'),
                clean: true,
            }),
            workerLoader(),
            babel({
                babelHelpers: 'runtime',
                exclude: [
                    'node_modules/**',
                    'src/modules/panoToCube/panoToCubeWorker.js'
                ],
                extensions: [
                    ...DEFAULT_EXTENSIONS,
                    '.ts',
                ],
            }),
            terser(),
            sourceMaps(),
        ],
    });
}

module.exports = config;
