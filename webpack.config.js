const path = require('path');
const glob = require('glob');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
    entry: glob.sync('./static/ts/**/*.ts').reduce((entries, entry) => {
        const entryName = path.relative('./static/ts', entry).replace(/\.ts$/, '');
        entries[entryName] = path.resolve(__dirname, entry);
        return entries;
    }, {}),
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })]
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'static/js'),
    },
    mode: 'development',
    devtool: 'source-map',
    optimization: {
        sideEffects: false
    },
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename], // Cache invalidation when the config file changes
        },
    },
};