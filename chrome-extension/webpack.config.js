const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup.ts',
    background: './src/background.ts',
    // Removed the content entry as content.ts is no longer needed
    login: './src/login.ts',
    styles: './src/styles.css',
    options: './src/options.ts',
    toast: './src/toast.ts',
    blocked: './src/blocked.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'manifest.json'), to: 'manifest.json' },
        { from: path.resolve(__dirname, 'public'), to: '.' },
        { from: path.resolve(__dirname, 'icons'), to: 'icons' },
      ],
    }),
  ],
  optimization: {
    minimize: false,
  },
  devtool: 'cheap-source-map',
};
