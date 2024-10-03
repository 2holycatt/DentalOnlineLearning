const path = require('path');

module.exports = {
    entry: './client/index.js',
    output: {
        path: path.resolve(__dirname, 'public/javascripts'),
        filename: 'bundle.js',
        publicPath: '/javascripts/',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ]
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
            publicPath: '/javascripts/',
        },
        compress: true,
        port: 9000,
        hot: true, // เพิ่ม HMR ที่นี่
    },
};

if (module.hot) {
    module.hot.accept();
}