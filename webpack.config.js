const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  mode: 'development',
  entry: './index.web.js',
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules(?!\/react-native-web)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@react-native/babel-preset'],
            plugins: [
              '@babel/plugin-transform-runtime',
            ],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
    alias: {
      'react-native$': 'react-native-web',
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'web-build'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
        REACT_APP_SUPABASE_URL: JSON.stringify(process.env.REACT_APP_SUPABASE_URL),
        REACT_APP_SUPABASE_ANON_KEY: JSON.stringify(process.env.REACT_APP_SUPABASE_ANON_KEY),
        REACT_APP_TESLA_CLIENT_ID: JSON.stringify(process.env.REACT_APP_TESLA_CLIENT_ID),
        REACT_APP_TESLA_REDIRECT_URI: JSON.stringify(process.env.REACT_APP_TESLA_REDIRECT_URI),
        REACT_APP_VERSION: JSON.stringify(process.env.REACT_APP_VERSION),
        REACT_APP_DOMAIN: JSON.stringify(process.env.REACT_APP_DOMAIN),
        REACT_APP_DEBUG: JSON.stringify(process.env.REACT_APP_DEBUG),
        // Add Expo equivalents for consistency
        EXPO_PUBLIC_SUPABASE_URL: JSON.stringify(process.env.EXPO_PUBLIC_SUPABASE_URL),
        EXPO_PUBLIC_SUPABASE_ANON_KEY: JSON.stringify(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
        EXPO_PUBLIC_TESLA_CLIENT_ID: JSON.stringify(process.env.EXPO_PUBLIC_TESLA_CLIENT_ID),
        EXPO_PUBLIC_TESLA_REDIRECT_URI: JSON.stringify(process.env.EXPO_PUBLIC_TESLA_REDIRECT_URI),
        EXPO_PUBLIC_VERSION: JSON.stringify(process.env.EXPO_PUBLIC_VERSION),
        EXPO_PUBLIC_DOMAIN: JSON.stringify(process.env.EXPO_PUBLIC_DOMAIN),
        EXPO_PUBLIC_DEBUG: JSON.stringify(process.env.EXPO_PUBLIC_DEBUG),
      }
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'web-build'),
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true,
  },
};
