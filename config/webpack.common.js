const webpack = require('webpack');
const path = require('path');
const package = require('../package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const autoprefixer = require('autoprefixer');

const build = (() => {
    const timestamp = new Date().getTime();
    return {
        name: package.name,
        version: package.version,
        timestamp: timestamp,
        author: package.author
    };
})();

const entry = {
    vendor: [
        'pixi.js',
    ],
    app: [
        './index.ts',
    ],
};

const rules = [
    {
        test: /\.ts$/,
        use: [
            'ts-loader'
        ],
        exclude: /node_modules/
    },
    {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
    },
    {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        type: 'asset/resource'
    }
];

const output = {
    path: path.resolve('dist'),
    publicPath: '',
    filename: '[name].[hash].js',
    chunkFilename: '[id].[hash].chunk.js'
};

const WEBPACK_PLUGINS = [
    new webpack.BannerPlugin({ banner: `${build.name} v.${build.version} (${build.timestamp}) © ${build.author}` }),
    new webpack.DefinePlugin({
        ENVIRONMENT: JSON.stringify({
            build: build
        })
    }),
    new webpack.LoaderOptionsPlugin({
        options: {
            htmlLoader: {
                minimize: true
            }
        }
    }),
];
module.exports = {
    context: path.resolve('./src'),
    entry,
    output,
    resolve: {
        extensions: ['.js', '.ts', '.css', '.html'],
        fallback: {
            fs: false
        }
    },
    module: {
        rules,
    },
    plugins: [
        ...WEBPACK_PLUGINS,
        new HtmlWebpackPlugin({
            title: 'Hmm',
            filename: 'index.html',
            template: './index.html',
        })
    ]
};
