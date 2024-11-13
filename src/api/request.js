import axios from 'axios';
// import { ElMessage } from 'element-plus';
import router from '@/router/index';
import {baseUrl} from "./baseUrl"
let refusing = false; // 标识某个时间段只允许提示一次错误信息

// 异常拦截处理器
const errorHandler = async (error) => {
    console.log(error.response)
    // response存在undefined 临时解决
    if (!error.response) {
        // router.push('/login');
    }
    if(error.response && error.response.data && error.response.data.code === 401) {
        console.log('登录过期，请重新登录')
        localStorage.removeItem('ACCESS_TOKEN')
        sessionStorage.removeItem('ACCESS_TOKEN');
        return;
    }
    const tip = !error.response?.config.noTip;
    if (error.response && error.response.data.code === 429) {
        console.log('操作过快 请稍后再试');
    }
    if (error.response && !refusing) {
        refusing = true;
        const data = error.response.data;
        // 从 localstorage 获取 token
        const token = localStorage.getItem('ACCESS_TOKEN');
        // 错误的接口请求
        if (tip && error.response.status === 400) {
            if (error.request.responseType === 'blob') {
                console.log('下载资源未找到！');
            } else {
                console.log(data.message);
            }
        }
        // 没有权限访问接口: 未授权、token为空、不合法、已失效等
        if (error.response.status === 401) {
            const code = (data.code + '').substring(0, 6);
            if (parseInt(code) === 401201) {
                if (tip && token) {
                    console.log(data.message);
                }
                // 主租户 产品未授权
                if (parseInt(data.code) === 4012010) {
                    // 登出并跳转制定页面,提示授权
                    await router.push({ name: '404' });
                } else if (parseInt(data.code) === 4012011) {
                    // 非主租户 租户未授权
                    // 删除登录信息跳转到指定页面
                    await router.push({ name: '404' });
                }
            }

            if (parseInt(code) === 401102 && tip) {
                // router.push('/login');
                console.log(data.message);
            }
        }
        // 接口不存在
        if (error.response.status === 404) {
            if (tip) {
                console.log('接口未找到');
            }
        }
        // 接口定义不合法
        if (error.response.status === 403) {
            if (tip) {
                console.log(data.message);
            }
        }
        // 后台错误统一提示
        if (error.response.status === 500
        || error.response.status === 501
        || error.response.status === 502
        || error.response.status === 503
        || error.response.status === 504) {
            if (tip) {
                console.log('服务器异常');
            }
        }
        // 重置标识
        setTimeout(() => {
            refusing = false;
        }, 1000);
    }
    return Promise.reject((error.response && error.response.data) ? error.response.data : { message: '网络异常' });
};
    // 创建 axios 实例
const service = axios.create({
    baseURL: baseUrl, 
    timeout: 0, // 请求超时时间
});
service.interceptors.request.use((config) => {
    const configT = config;
    const token = localStorage.getItem('ACCESS_TOKEN') || sessionStorage.getItem('ACCESS_TOKEN');
    const tenant = localStorage.getItem('TENANT_CODE');
    if (token) {
        configT.isMock ? (configT.headers['Access-Token'] = '4291d7da9005377ec9aec4a71ea837f')
            : (configT.headers.Authorization = token);
    }
    if (tenant) {
        configT.headers.Tenant = tenant;
    }
    return configT;
}, errorHandler);
// 返回拦截
service.interceptors.response.use(response => {
    // console.log(response, 'responseresponseresponse')
    if (response.request.responseType === 'blob') {
        return response;
    }
    const resData = response.data;
    if(response.data && response.data.code && response.data.code !== 200) {
        // console.log(response, 'responseresponseresponse')
        // console.log(response.data.msg)
    }
    // token刷新
    // const token = response.headers.authorization;
    // if (token) {
    //     localStorage.setItem('ACCESS_TOKEN', token);
    // }
    return resData;
}, errorHandler);
const install = function (app) {
    app.config.globalProperties.$axios = service;
};
export default service;
export { install as VueAxios, service as axios };
