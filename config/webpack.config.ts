import * as path from "path"
import * as webpack from "webpack"
import HtmlWebpackPlugin from "html-webpack-plugin"
import pkg from "../package.json"

interface Environment {
    prod: boolean
}

const build = {
        name: pkg.name,
        version: pkg.version,
        timestamp: new Date().getTime(),
        author: pkg.author
}

export default function(env: Environment): webpack.Configuration {
    if (env.prod) console.log("Performing production build. This will take a while...")
    else console.log("Performing development build...")

    const baseConfig: webpack.Configuration = {
        context: path.resolve("./src"),
        entry: {
            app: ["./index.ts"]
        },
        output: {
            path: path.resolve("./dist"),
            publicPath: ""
        },
        performance: {
            hints: "warning"
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: ["ts-loader"],
                    exclude: /node_modules/
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"]
                },
                {
                    test: /\.(png|jpe?g|gif|svg)$/,
                    type: "asset/resource"
                }
            ]
        },
        resolve: {
            extensions: [".ts", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg"]
        },
        plugins: [
            new webpack.BannerPlugin({ banner: `${build.name} v.${build.version} (${build.timestamp}) © ${build.author}` }),
            new webpack.DefinePlugin({
                ENVIRONMENT: JSON.stringify({ build })
            }),
            new HtmlWebpackPlugin({
                title: 'The Game',
                filename: 'index.html',
                template: './index.html',
            }),
        ]
    }

    const devConfig: webpack.Configuration = {
        mode: "development",
        devtool: "inline-source-map",
        devServer: {
            publicPath: "/",
            contentBase: path.resolve("./dist"),
            compress: true,
            overlay: {
                warnings: false,
                errors: true
            },
            port: 3000,
        }
    }

    const prodConfig: webpack.Configuration = {
        mode: "production",
    }

    const config = env.prod ?
        { ...baseConfig, ...prodConfig } :
        { ...baseConfig, ...devConfig }

    return config
}
