# krpnao-js-tools

## 介绍：高性能的krpano js工具，在浏览器中切图和还原全景图，替代krpano命令行工具


## 一、功能介绍

### 在浏览器中将全景图转为立方体图、多层级瓦片图

优势：
* 快，算法优化，比krpano原生工具快45% ~ 100%。一张100m的全景图，切成立方体切图只需要10s，产物只有8m左右，最终只需要将8m的内容上传到服务器，而使用krpano切图需要将100m的图片上传到服务器，优势不言而喻！
* 降低服务器压力，将服务器的压力分摊到每个用户的电脑上

备注：

> * 切图的逻辑、缩略图、预览图均以krpano为标准，如果是使用krpano来开发全景的，可以直接使用，暂时未开发自定义切图的参数，后续可能会开放。
> * 目前仅支持**jpeg/jpg**，**20000x10000**分辨率以内的图片，当然这已经是覆盖了80%的使用场景了
> * 切图速度快于krpano原生工具（快45% ~ 100%）
> * 如果需要更高的要求还是可以使用krpano工具，也可以混着使用
> * 由于是用来worker多线程，建议一张一张地切，不要同时切多张，这样可以保证稳定性

如下功能：

---

1. 生成立方体图片（6个面）
2. 生成多分辨率瓦片图（层级根据图片分辨率自动调节）
3. 生成场景预览图preview.jpg
4. 生成场景缩略图thumb.jpg
5. 生成krpano代码：场景代码、立方体image节点代码、多分辨率image节点代码（包含简写和完整两种写法）
6. 生成的图片和场景，均无水印

## 二、如何使用

### 安装依赖
```shell
npm i @krpano/js-tools

yarn add @krpano/js-tools
```

### 切图，示例：在vue中的使用：
```vue
<template>
    <input type="file" name="test" @change="onFileChange" accept="image/jpeg,image/png">
</template>

<script>

// （可选）用于下载文件
import FileSaver from 'file-saver'
// 导入
import KrpanoToolJS from '@krpano/js-tools'

export default {
    methods: {
        onFileChange(e) {
            const file = e.target.files[0]
            if (!file) return
            
            const krpanoTool = new KrpanoToolJS()
            krpanoTool.makeTiles(file).then(result => {
                // result 的具体值看下面介绍
                // 可选，可以使用FileSaver，把内容下载下来
                FileSaver.saveAs(result.content)
            })
        },
    }
}
</script>

```
### 切图的返回值
```typescript
// result对象
interface IConvertPanoResult {
    dirName: string;  // 生成根目录文件夹名称
    content: Blob; // 场景图片、缩略图、预览图 的Blob文件，可以用于上传到后台或者下载到本地
    duration: string | number; // 单次切图时长
    code: {  // 代码
        scene: string;  // 整个场景的代码
        cubeImage: string; // 立方体切图image节点的代码
        tileImage: string; // 多分辨率切图image节点的代码
        shortTileImage: string; // (简写)多分辨率切图image节点的代码
    };
}
```

### 切图方法
```typescript
// 生成立方体图（6张）、缩略图、预览图
makeCube(file: File): Promise<IConvertPanoResult>;

// 生成多分辨率瓦片图、缩略图、预览图
makeTiles(file: File): Promise<IConvertPanoResult>;

// 同时生成立方体图、多分辨率瓦片图
makeCubeAndTiles(file: File): Promise<IConvertPanoResult>;
```

### Q&A
1. 使用webpack5打包会报一个警告
   在webpack.config.js中加入如下代码：
```js
module.exports = {
  resolve: {
    //  跳过worker_threads的检查
    fallback: {
      "worker_threads": false,
    }
  }
}
```

## 三、还原全景图（敬请期待）

1. 在浏览器爬取图片
2. **还原全景图**


## 特别鸣谢
> jaxry https://github.com/jaxry
