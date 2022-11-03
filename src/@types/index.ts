/**
 * ESplitImageType：图片切图类型
 * cube：立方体（普通切图）
 * tiles：多分辨率（高清切图）
 * all：以上两种同时生成
 */
export enum ESplitImageType {
    cube = 'cube',
    tiles = 'tiles',
    all = 'all',
}

/**
 * 切图返回的结果
 */
export interface IConvertPanoResult {
    dirName: string;
    content: Blob | null;
    duration: string | number;
    code: {
        scene: string;
        cubeImage: string;
        tileImage?: string;
        shortTileImage?: string;
    };
}
