import JSZipUtils from 'jszip-utils'

/**
 * 移除base64头部
 * @param base64Str base64 字符串
 */
export function removeBase64Header(base64Str) {
    if (!base64Str) return ''
    return base64Str.replace('data:image/jpeg;base64,', '')
}

export function urlToBinaryContent(url) {
    return new Promise(function (resolve, reject) {
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

export function getTimeDifference(time1: Date, time2: Date): string {
    const diffTime: number = Math.round(Math.abs(time1.getTime() - time2.getTime()) / 1000)
    const day: number = parseInt(String(diffTime / (60 * 60 * 24)))
    const hours: number = parseInt(String(diffTime % (60 * 60 * 24) / (60 * 60)))
    const minutes: number = parseInt(String(diffTime % (60 * 60) / 60))
    const seconds: number = diffTime % 60

    let result = ''
    day ? result += `${day}天` : ''
    hours ? result += `${hours}小时` : ''
    minutes ? result += `${minutes}分钟` : ''
    seconds ? result += `${seconds}秒` : ''
    return result || '0秒'
}

/**
 * 将传入的imageData进行缩放后，输出新的imageData
 * @param inputImageData 输入imageData
 * @param outputWidth 输出的宽度
 * @param outputHeight 输出的高度
 */
export function scaleImageData(inputImageData: ImageData, outputWidth: number, outputHeight: number): ImageData {
    const canvas = document.createElement('canvas') as HTMLCanvasElement
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d')
    canvas.width = inputImageData.width
    canvas.height = inputImageData.height
    ctx.putImageData(inputImageData, 0, 0)
    ctx.scale(outputWidth / inputImageData.width, outputHeight / inputImageData.height)
    ctx.drawImage(canvas, 0, 0)
    const scaleImageData = ctx.getImageData(0, 0, outputWidth, outputHeight)
    canvas.remove()
    return scaleImageData
}

/**
 * convert imageData blur
 * @param imgData
 * @param sigma
 */
export function gaussBlur(imgData: ImageData, sigma: number = 1.8): ImageData {
    const pixes = imgData.data
    const width = imgData.width
    const height = imgData.height
    const gaussMatrix = []
    let gaussSum = 0,
        x, y,
        r, g, b, a,
        i, j, k, len

    const radius = 3

    a = 1 / (Math.sqrt(2 * Math.PI) * sigma)
    b = -1 / (2 * sigma * sigma)
    //生成高斯矩阵
    for (i = 0, x = -radius; x <= radius; x++, i++) {
        g = a * Math.exp(b * x * x)
        gaussMatrix[i] = g
        gaussSum += g

    }

    //归一化, 保证高斯矩阵的值在[0,1]之间
    for (i = 0, len = gaussMatrix.length; i < len; i++) {
        gaussMatrix[i] /= gaussSum
    }
    //x 方向一维高斯运算
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            r = g = b = a = 0
            gaussSum = 0
            for (j = -radius; j <= radius; j++) {
                k = x + j
                if (k >= 0 && k < width) {//确保 k 没超出 x 的范围
                    //r,g,b,a 四个一组
                    i = (y * width + k) * 4
                    r += pixes[i] * gaussMatrix[j + radius]
                    g += pixes[i + 1] * gaussMatrix[j + radius]
                    b += pixes[i + 2] * gaussMatrix[j + radius]
                    // a += pixes[i + 3] * gaussMatrix[j];
                    gaussSum += gaussMatrix[j + radius]
                }
            }
            i = (y * width + x) * 4
            // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
            pixes[i] = r / gaussSum
            pixes[i + 1] = g / gaussSum
            pixes[i + 2] = b / gaussSum
            // pixes[i + 3] = a ;
        }
    }
    //y 方向一维高斯运算
    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            r = g = b = a = 0
            gaussSum = 0
            for (j = -radius; j <= radius; j++) {
                k = y + j
                if (k >= 0 && k < height) {//确保 k 没超出 y 的范围
                    i = (k * width + x) * 4
                    r += pixes[i] * gaussMatrix[j + radius]
                    g += pixes[i + 1] * gaussMatrix[j + radius]
                    b += pixes[i + 2] * gaussMatrix[j + radius]
                    // a += pixes[i + 3] * gaussMatrix[j];
                    gaussSum += gaussMatrix[j + radius]
                }
            }
            i = (y * width + x) * 4
            pixes[i] = r / gaussSum
            pixes[i + 1] = g / gaussSum
            pixes[i + 2] = b / gaussSum
        }
    }
    return imgData
}

const mimeType = {
    'jpg': 'image/jpeg',
    'png': 'image/png'
}

/**
 * 创建唯一id
 * @param length 字符串长度
 */
export function getUniqueId(length: number = 36): string {
    const temp = '0123456789abcdefghijklmnopqrstuvwsyz'
    const d = new Date()
    let str = d.getTime().toString()
    for (let i = 0; i < 5; i++) {
        const index = Math.round(Math.random() * 36)
        str += temp[index]
    }
    return length >= 36 ? str : str.substring(str.length - length, str.length)
}

export function isMac() {
    return /macintosh|mac os x/i.test(navigator.userAgent.toLowerCase())
}

export function isWin() {
    const agent = navigator.userAgent.toLowerCase()
    return agent.indexOf("win32") >= 0
        || agent.indexOf("wow32") >= 0
        || agent.indexOf("win64") >= 0
        || agent.indexOf("wow64") >= 0
}
