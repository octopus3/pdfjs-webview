const path = require('path')
function resolve(dir) {
  return path.join(__dirname, dir)
}

const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: config => {
    config.resolve.alias
    .set("@", resolve("src"))
    .set("@STYLES", resolve("src/styles"))
    config
    .plugin('html')
    .tap(args => {
        args[0].title = 'PDF'
        return args
    })
  },
  css: {
    extract: true,
    sourceMap: true,
    loaderOptions: {
        // 给 sass-loader 传递选项
        sass: {
            // @/ 是 src/ 的别名
            // 所以这里假设你有 `src/variables.scss` 这个文件
            additionalData: `
                    @import "@STYLES/variables.scss";
                `
        },
        scss: {
            additionalData: `
                    @import "@STYLES/variables.scss";
                `
        },
    }
},
})
