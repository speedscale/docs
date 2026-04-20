import fs from 'fs';
import path from 'path';

const currentBundlerPath = path.join(process.cwd(), 'node_modules/@docusaurus/bundler/lib/currentBundler.js');

// Read the original file
let fileContent = fs.readFileSync(currentBundlerPath, 'utf8');

// Remove webpackbar import
fileContent = fileContent.replace(/const webpackbar_1 = tslib_1\.__importDefault\(require\("webpackbar"\)\);/, '// Removed webpackbar import');

// Replace the return statement with our custom class
const oldReturn = '    return webpackbar_1.default;';
const newContent = `    class CustomWebpackProgressPlugin {
        constructor(options) {
            this.options = options;
        }
        apply(compiler) {
            const options = this.options;
            if (compiler.hooks && compiler.hooks.compile) {
                compiler.hooks.compile.tap("ProgressPlugin", (compilerParams) => {
                    console.log("Compiling " + (options.name || "webpack") + "...");
                });
            }
            if (compiler.hooks && compiler.hooks.done) {
                compiler.hooks.done.tap("ProgressPlugin", (stats) => {
                    console.log("Build " + (stats.hasErrors() ? "failed" : "completed") + " for " + (options.name || "webpack"));
                });
            }
        }
    }
    return CustomWebpackProgressPlugin;`;

fileContent = fileContent.replace(oldReturn, newContent);

fs.writeFileSync(currentBundlerPath, fileContent);
console.log('Patched currentBundler.js');
