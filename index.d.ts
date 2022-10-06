/**
 * ESplitImageType：图片切图类型
 * cube：立方体（普通切图）
 * tiles：多分辨率（高清切图）
 * all：以上两种同时生成
 */
export declare enum ESplitImageType {
    cube = "cube",
    tiles = "tiles",
    all = "all"
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
/**
 * KrpanoToolJS工具，可在浏览器切图和还原图片
 */
export default class KrpanoToolJS {
    constructor();
    [key: string]: Function;
    private splitImage;
    /**
     * 生成立方体图（普通切图）
     * @param file input file
     */
    makeCube(file: File): Promise<IConvertPanoResult>;
    /**
     * 多分辨率切图
     * @param file input file
     */
    makeTiles(file: File): Promise<IConvertPanoResult>;
    /**
     * 同时生成立方体和多分辨率切图
     * @param file input file
     */
    makeCubeAndTiles(file: File): Promise<IConvertPanoResult>;
    /**
     * 检测图片是否符合(jpg,小于2万px)
     * @param file
     */
    checkFile(file: File): Promise<boolean | string>;
    /**
     * 多分辨率转为立方体图（敬请期待）
     */
    tilesToCube(): void;
    /**
     * 立方体图转为全景图（敬请期待）
     */
    cubeToPano(): void;
}
//# sourceMappingURL=index.d.ts.map