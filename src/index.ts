import JSZip from 'jszip'

import PanoToCube, {ICubeImage} from './modules/panoToCube/panoToCube'
import MakeTiles, {EInputDataType, ILevelConfig, IOptions, TTilesList} from './modules/makeTiles'
import {getTimeDifference, getUniqueId, removeBase64Header} from './utils/utils'
import {EImageType, getImageXml, getSceneXml} from './modules/genKrpanoCode'
import {ESplitImageType, IConvertPanoResult} from './@types'


/**
 * KrpanoToolJS工具，可在浏览器切图和还原图片
 */
export default class KrpanoToolJS {

    constructor() {
        console.log('constructor KrpanoJSTool')
    }

    [key: string]: Function

    private async splitImage(file: File, type: ESplitImageType): Promise<IConvertPanoResult> {

        const checkResult = await this.checkFile(file)
        if (checkResult !== true) {
            return Promise.reject(checkResult)
        }

        const title = file.name.substr(0, file.name.lastIndexOf('.'))
        let tilesLevelConfig: ILevelConfig[]

        /**
         * 1、单个场景文件夹名称：文件名转为拼音 + '_' + 随机数
         * 2、krpano不支持大写，统一转为小写
         */
        const pinyinName = 'pano_' + getUniqueId(8)

        // 场景名称不能以数字开头
        const sceneName = 'scene_' + pinyinName
        const dirName = pinyinName + '.tiles'

        const startTime = new Date()

        return new Promise(resolve => {
            const zip = new JSZip()
            const folder = zip.folder(`${dirName}`) as JSZip
            const result: IConvertPanoResult = {
                dirName: dirName,
                content: null,
                duration: 0,
                code: {
                    scene: '',
                    cubeImage: '',
                    tileImage: '',
                    shortTileImage: '',
                }
            }
            const panoToCube = new PanoToCube(file)
            panoToCube.genCubeDatasAsync().then(async data => {

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

                setTimeout(function () {
                    zip
                        .generateAsync({
                            type: 'blob',
                        })
                        .then(content => {
                            result.content = content
                            result.duration = getTimeDifference(startTime, new Date())
                            resolve(result)
                        })
                }, 20)
            })
        })
    }

    /**
     * 生成立方体图（普通切图）
     * @param file input file
     */
    public makeCube(file: File) {
        return this.splitImage(file, ESplitImageType.cube)
    }

    /**
     * 多分辨率切图
     * @param file input file
     */
    public makeTiles(file: File) {
        return this.splitImage(file, ESplitImageType.tiles)
    }

    /**
     * 同时生成立方体和多分辨率切图
     * @param file input file
     */
    public makeCubeAndTiles(file: File) {
        return this.splitImage(file, ESplitImageType.all)
    }

    /**
     * 检测图片是否符合(jpg,小于2万px)
     * @param file
     */
    public checkFile(file: File): Promise<boolean | string> {
        return new Promise((resolve, reject) => {
            if (file.type !== 'image/jpeg') {
                reject('仅支持jpeg或jpg图片')
            }
            const url = window.URL || window.webkitURL
            const img = new Image()
            img.src = url.createObjectURL(file)
            img.onload = function () {
                if (img.width > 20000) {
                    img.remove()
                    reject('图片需要小于20000*10000')
                } else {
                    resolve(true)
                }
            }
        })
    }

    /**
     * 多分辨率转为立方体图（敬请期待）
     */
    public tilesToCube() {
        console.log('敬请期待-tilesToCube')
    }
    /**
     * 立方体图转为全景图（敬请期待）
     */
    public cubeToPano() {
        console.log('敬请期待-cubeToPano')
    }
}

