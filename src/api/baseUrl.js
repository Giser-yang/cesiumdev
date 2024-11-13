let baseUrl = ""
if (process.env.NODE_ENV === 'development') {
    baseUrl = 'http://10.20.170.17:30169/'
} else if (process.env.NODE_ENV === 'production') {
    //这是服务器地址
    baseUrl = 'http://10.20.170.17:30159/'
}
export { baseUrl }