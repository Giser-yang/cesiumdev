import request from '@/api/request';

// 获取影像服务地址
export function getBaseMapService() {
    return request({
        url: 'gis/info/getImageService',
        method: 'get',
    });
}

