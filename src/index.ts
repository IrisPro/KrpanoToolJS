import JSZip from 'jszip'
import {pinyin} from 'pinyin-pro'

import PanoToCube, {ICubeImage} from './modules/panoToCube/panoToCube'
import MakeTiles, {EInputDataType, ILevelConfig, IOptions, TTilesList} from './modules/makeTiles'
import {getTimeDifference, getUniqueId, removeBase64Header} from './utils/utils'
import {EImageType, getImageXml, getSceneXml} from './modules/genKrpanoCode'

enum ESplitImageType {
    cube = 'cube',
    tiles = 'tiles',
    all = 'all',
}

interface IConvertPanoResult {
    dirName: string;
    content: Blob;
    code: {
        scene: string;
        cubeImage: string;
        tileImage?: string;
        shortTileImage?: string;
    };
}

export default class KrpanoToolJS {

    constructor() {
        console.log('constructor KrpanoJSTool')
    }

    private splitImage(file: File, type: ESplitImageType): Promise<IConvertPanoResult> {
        const title = file.name.substr(0, file.name.lastIndexOf('.'))
        let tilesLevelConfig: ILevelConfig[] = null

        /**
         * 1、单个场景文件夹名称：文件名转为拼音 + '_' + 随机数
         * 2、krpano不支持大写，统一转为小写
         */
        const pinyinName = pinyin(title, {toneType: 'none'}).toLocaleLowerCase().replace(/\s+/g, '') + '_' + getUniqueId(5)

        // 场景名称不能以数字开头
        const sceneName = 'scene_' + pinyinName
        const dirName = pinyinName + '.tiles'

        const startTime = new Date()

        return new Promise(resolve => {
            const zip = new JSZip()
            const folder = zip.folder(`${dirName}`)
            const result: IConvertPanoResult = {
                dirName: dirName,
                content: null,
                code: {
                    scene: '',
                    cubeImage: '',
                    tileImage: '',
                    shortTileImage: '',
                }
            }
            const panoToCube = new PanoToCube(file)
            panoToCube.genCubeDatasAsync().then(async data => {

                console.log('data', data)
                // 生成预览图：preview.jpg
                folder.file('preview.jpg', removeBase64Header(panoToCube.generatePreviewImage()), {base64: true})

                // 生成缩略图：thumb.jpg
                folder.file('thumb.jpg', removeBase64Header(panoToCube.generateThumb()), {base64: true})

                // 生成 cube图片
                if (type === ESplitImageType.cube || type === ESplitImageType.all) {
                    const cubes: ICubeImage[] = panoToCube.genCubeImages()
                    cubes.forEach(cube => {
                        folder.file(`pano_${cube.name}.jpg`, removeBase64Header(cube.url), {base64: true})
                    })
                }

                // 生成多分辨率瓦片图
                if (type === ESplitImageType.tiles || type === ESplitImageType.all) {
                    data.forEach(face => {
                        const params: IOptions = {
                            inputData: face.data,
                            type: EInputDataType.imageData,
                            imageWidth: face.data.width,
                            imageHeight: face.data.height,
                            panoWidth: panoToCube.imageWidth,
                            faceName: face.name,
                        }

                        const makeTileTool = new MakeTiles(params)
                        const tiles: TTilesList = makeTileTool.generate()
                        if (!tilesLevelConfig) {
                            tilesLevelConfig = makeTileTool.levelConfig
                        }
                        console.log('tiles', tiles)
                        tiles.forEach(itemTile => {
                            folder.file(itemTile.path, removeBase64Header(itemTile.base64), {base64: true})
                        })
                    })
                }

                // 生成代码
                result.code.scene = getSceneXml({
                    dirName,
                    sceneName,
                    title,
                    type: type === ESplitImageType.tiles ? EImageType.tiles : EImageType.cube,
                    levelConfig: tilesLevelConfig,
                })
                switch (type) {
                    case ESplitImageType.tiles:
                        result.code.tileImage = getImageXml(EImageType.tiles, dirName, tilesLevelConfig)
                        result.code.shortTileImage = getImageXml(EImageType.shortTiles, dirName, tilesLevelConfig)
                        break
                    case ESplitImageType.cube:
                        result.code.cubeImage = getImageXml(EImageType.cube, dirName)
                        break
                    default:
                        result.code.cubeImage = getImageXml(EImageType.cube, dirName)
                        result.code.tileImage = getImageXml(EImageType.tiles, dirName, tilesLevelConfig)
                        result.code.shortTileImage = getImageXml(EImageType.shortTiles, dirName, tilesLevelConfig)

                }

                // for test
                // folder.file('tour.xml', getKrpanoXml(result.code.scene))

                setTimeout(function () {
                    zip
                        .generateAsync({
                            type: 'blob',
                        })
                        .then(content => {
                            result.content = content
                            resolve(result)
                            console.log('耗时', getTimeDifference(startTime, new Date()))
                            // FileSaver.saveAs(content)
                        })
                }, 20)
            })
        })
    }

    public makeCube(file: File) {
        return this.splitImage(file, ESplitImageType.cube)
    }

    public makeTiles(file: File) {
        return this.splitImage(file, ESplitImageType.tiles)
    }

    public makeCubeAndTiles(file: File) {
        return this.splitImage(file, ESplitImageType.all)
    }

    public checkPanoImage() {
        console.log('checkPanoImage')
    }

    public tilesToCube() {
        console.log('tilesToCube')
    }

    public cubeToPano() {
        console.log('cubeToPano')
    }
}

