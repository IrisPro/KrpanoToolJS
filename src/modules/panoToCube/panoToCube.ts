import PanoToCubeWorker from 'web-worker:./panoToCubeWorker.js'
import {gaussBlur, scaleImageData, isWin, isMac} from '../../utils/utils'
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
    private finishedCount: number = 0
    static interpolation = {
        linear: 'linear', // 更柔和的细节
        cubic: 'cubic', // 更清晰的细节
        lanczos: 'lanczos', // lanczos算法，质量最好，速度最慢
    }
    private facePositions: string[] = ['f', 'b', 'r', 'l', 'u', 'd']
    private tempFacePositions = []
    public faceDatas: IFaceData[] = []
    public cbResolve: Function | undefined
    public cbReject: Function | undefined
    private type: ESplitImageType

    constructor(imageFile?: File) {
        this.imageFile = imageFile
    }

    public genCubeDatasAsync(type: ESplitImageType): Promise<IFaceData[]> {
        return new Promise((resolve, reject) => {
            if (!this.imageFile) reject()

            this.type = type
            this.cbResolve = resolve
            this.cbReject = reject

            // Limit the maximum size on the windows
            const winLinitSize = 10100

            const img = new Image()
            img.src = URL.createObjectURL(this.imageFile)

            img.addEventListener('load', () => {
                const {width, height} = img
                this.canvas.width = width
                this.canvas.height = height
                if (isWin() && width > winLinitSize) {
                    img?.remove()
                    reject(false)
                    return
                }
                this.ctx.drawImage(img, 0, 0)
                const data = this.ctx.getImageData(0, 0, width, height)
                this.processImage(data)
            })
        })
    }

    processImage(data: ImageData) {
        this.facePositions.forEach(name => {
            this.tempFacePositions.push({
                name,
                isRendering: false,
            })
        })
        if (isMac()) {
            this.facePositions.forEach((faceName, index) => {
                this.renderFace(data, index)
            })
        } else {
            // Limit the maximum thread on the window
            this.renderFace(data, 0)
            this.renderFace(data, 3)
        }
    }

    renderFace(data: ImageData, faceIndex: number) {
        if (faceIndex > this.tempFacePositions.length - 1 || this.tempFacePositions.length === 0) {
            return
        }
        const currentFace = this.tempFacePositions[faceIndex]

        if (currentFace.isRendering) return

        const faceName = currentFace.name
        currentFace.isRendering = true

        const options = {
            data: data,
            face: faceName,
            maxWidth: this.type === ESplitImageType.cube ? 2048 : Infinity
        }

        const worker = new PanoToCubeWorker()

        try {
            worker.postMessage(options)
        } catch (e) {
            data = null
            this.cbReject(false)
        }

        worker.onmessage = ({data: inputData}) => {
            if (inputData === 'renderingFailed') {
                data = null
                this.cbReject(false)
                return
            }
            this.finishedCount++
            this.faceDatas.push({
                name: faceName,
                data: inputData,
            })

            worker.terminate()
            if (this.finishedCount === 6) {
                this.cbResolve && this.cbResolve(this.faceDatas)
            } else {
                if (isWin()) {
                    this.renderFace(data, ++faceIndex)
                }
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
     */
    generateThumb(faceName: string = 'f', size: number = 400) {
        const canvas = document.createElement('canvas') as HTMLCanvasElement
        const ctx = canvas.getContext('2d', {willReadFrequently: true}) as CanvasRenderingContext2D
        canvas.width = size
        canvas.height = size
        const imageData = scaleImageData(this.faceDatas.find(item => item.name === faceName).data, size, size)
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
