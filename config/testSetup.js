// This file is run by Node and so needs to be in JavaScript and use require instead of import

const tsNode = require("ts-node");
const registerJsdom = require("jsdom-global");

process.env.NODE_ENV = "test"

// Disable webpack-specific features for tests since
// Mocha doesn't know what to do with them.
require.extensions[".css"] = () => null
require.extensions[".png"] = () => null
require.extensions[".jpg"] = () => null
require.extensions[".svg"] = () => null

// Register ts-node to handle TypeScript files
tsNode.register({
    compilerOptions: {
        // For some reason ts-node does not take this from tsconfig.json files in either client, test or tools
        downlevelIteration: true
    }
})

// This will register a virtual browser environment
registerJsdom();
