const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  // mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
        {
            test: /\.js|jsx$/,
            exclude: /node_modules/,
            use: {
                loader:  'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env',
                        ['@babel/preset-react', {"runtime": "automatic"}]
                    ],
                }
            }
        },
        {
            test: /\.css$/i,
            use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"]
        },
        {
            test: /\.(gif|png|jpe?g)$/,
            use: [
              {
                loader: 'file-loader',
                options: {
                  name: '[name].[ext]',
                  outputPath: 'dist/images/'
                }
              }
            ]
        },
        {
            test: /\.svg$/i,
            use: [
                {
                    loader: 'svg-url-loader',
                    options: {
                        limit: 10000,
                    },
                },
            ]
        }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'popup.html', 
    }),
    new MiniCssExtractPlugin(),
    new CopyPlugin({
        patterns: [
            {
                from: "public", 
            }
        ]
    })
  ],
};