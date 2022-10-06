export declare enum ESplitImageType {
    cube = "cube",
    tiles = "tiles",
    all = "all"
}
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
export default class KrpanoToolJS {
    constructor();
    private splitImage;
    makeCube(file: File): Promise<unknown>;
    makeTiles(file: File): Promise<unknown>;
    makeCubeAndTiles(file: File): Promise<unknown>;
    checkFile(file: File): Promise<unknown>;
    tilesToCube(): void;
    cubeToPano(): void;
}
