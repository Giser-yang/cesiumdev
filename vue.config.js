const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack')
module.exports = defineConfig({
  
  transpileDependencies: true,
  lintOnSave: false,
  publicPath: './',
  devServer: {
    port: 8081,
    // host: 'localhost',
    https: false,
    open: true,
    client: {
      overlay: false // 编译错误时，取消全屏覆盖（建议关掉）
    }
  },
 
})
