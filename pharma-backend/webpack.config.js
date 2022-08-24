const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
    return {
        ...options,
        entry: [options.entry],
        externals: [nodeExternals()],
        plugins: [...options.plugins],
    };
};
