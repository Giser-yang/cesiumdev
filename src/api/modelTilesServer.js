import request from '@/api/request';

// 获取影像服务地址
export function getModelTilesService(param) {
    return request({
        url: 'model/getAreaTiles',
        method: 'post',
        data:param
    });
}

