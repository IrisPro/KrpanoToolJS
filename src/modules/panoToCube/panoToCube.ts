import PanoToCubeWorker from 'web-worker:./panoToCubeWorker.js'
import {gaussBlur, scaleImageData} from '../../utils/utils'
import {imageQuality, mimeType} from '../../utils/constant'
import {ESplitImageType} from '../../@types'

export interface IFaceData {
    name: string;
    data: ImageData;
}

export interface ICubeImage {
    name: string;
    url: string;
}

export default class PanoToCube {
    private imageFile: File | undefined
    public canvas: HTMLCanvasElement = document.createElement('canvas')
    private ctx = this.canvas.getContext('2d', {willReadFrequently: true}) as CanvasRenderingContext2D
    private workers: Worker[] = []
    private finishedCount: number = 0
    static interpolation = {
        linear: 'linear', // 更柔和的细节
        cubic: 'cubic', // 更清晰的细节
        lanczos: 'lanczos', // lanczos算法，质量最好，速度最慢
    }

    public faceDatas: IFaceData[] = []
    public callbackFunc: Function | undefined
    private type: ESplitImageType

    constructor(imageFile?: File) {
        this.imageFile = imageFile
    }

    public genCubeDatasAsync(type: ESplitImageType): Promise<IFaceData[]> {
        return new Promise((resolve, reject) => {
            if (!this.imageFile) reject()

            this.type = type

            this.callbackFunc = resolve
            const img = new Image()
            img.src = URL.createObjectURL(this.imageFile)

            img.addEventListener('load', () => {
                const {width, height} = img
                this.canvas.width = width
                this.canvas.height = height
                this.ctx.drawImage(img, 0, 0)
                const data = this.ctx.getImageData(0, 0, width, height)

                this.processImage(data)
            })
        })
    }

    processImage(data: ImageData) {
        const facePositions = {
            f: {x: 1, y: 1},
            b: {x: 3, y: 1},
            r: {x: 2, y: 1},
            l: {x: 0, y: 1},
            u: {x: 1, y: 0},
            d: {x: 1, y: 2}
        }
        for (const worker of this.workers) {
            worker.terminate()
        }

        for (const [faceName] of Object.entries(facePositions)) {
            this.renderFace(data, faceName)
        }
    }


    renderFace(data: ImageData, faceName: string) {

        const options = {
            data: data,
            face: faceName,
            maxWidth: this.type === ESplitImageType.cube ? 2048 : Infinity
        }

        const worker = new PanoToCubeWorker()
        this.workers.push(worker)

        worker.postMessage(options)

        worker.onmessage = ({data: inputData}) => {
            this.finishedCount++
            this.faceDatas.push({
                name: faceName,
                data: inputData,
            })

            if (this.finishedCount === 6) {
                this.callbackFunc && this.callbackFunc(this.faceDatas)
            }
        }
    }

    /**
     * 生成立方体图 6 张
     * @param size 图片尺寸
     */
    genCubeImages(size = 2048): ICubeImage[] {
        const canvas = document.createElement('canvas') as HTMLCanvasElement
        const ctx = canvas.getContext('2d', {willReadFrequently: true}) as CanvasRenderingContext2D
        canvas.width = size
        canvas.height = size
        const cubeImages: ICubeImage[] = []

        this.faceDatas.forEach(faceData => {
            ctx.putImageData(scaleImageData(faceData.data, size, size), 0, 0)
            cubeImages.push({
                name: faceData.name,
                url: canvas.toDataURL(mimeType.jpg, imageQuality)
            })
        })

        canvas.remove()
        return cubeImages
    }

    /**
     * 生成缩略
     * @param faceName 某一面
     * @param size 图片大小
     * @param isBlur 模糊
     */
    generateThumb(faceName: string = 'f', size: number = 240, isBlur: boolean = true) {
        const canvas = document.createElement('canvas') as HTMLCanvasElement
        const ctx = canvas.getContext('2d', {willReadFrequently: true}) as CanvasRenderingContext2D
        canvas.width = size
        canvas.height = size
        let imageData = scaleImageData(this.faceDatas.find(item => item.name === faceName).data, size, size)
        if (isBlur) {
            imageData = gaussBlur(imageData, 1)
        }
        ctx.putImageData(imageData, 0, 0)

        const imageUrl = canvas.toDataURL(mimeType.jpg, imageQuality)
        canvas.remove()

        return imageUrl
    }

    /**
     * 生成预览图：需要等到所有图片都生成完了才可以去调用
     * 预览图：参考krpano顺序：l f r b u d，自上而下
     */
    public generatePreviewImage(): string {
        if (this.faceDatas.length === 0) throw '需要先生成cube图'

        const cubeSize = 256
        const faceNames: string[] = ['l', 'f', 'r', 'b', 'u', 'd']
        const canvas = document.createElement('canvas') as HTMLCanvasElement
        const ctx = canvas.getContext('2d', {willReadFrequently: true}) as CanvasRenderingContext2D
        canvas.width = cubeSize
        canvas.height = cubeSize * faceNames.length

        faceNames.forEach((faceName, index) => {
            let imageData: ImageData = scaleImageData(this.faceDatas.find(item => item.name === faceName).data, cubeSize, cubeSize)
            imageData = gaussBlur(imageData)
            ctx.putImageData(imageData, 0, index * cubeSize)
        })

        const previewImageUrl = canvas.toDataURL(mimeType.jpg, imageQuality)
        canvas.remove()

        return previewImageUrl
    }

    get imageWidth(): number {
        return this.canvas.width
    }

    get imageHeight(): number {
        return this.canvas.height
    }
}
