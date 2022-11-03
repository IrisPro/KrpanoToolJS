# ChangeLog

#### 1.1.9 发版时间 2022.11.05

- new：增加默认导出全局变量**KrpanoToolJS** ，可以通过引入url方式来使用
- pref：切图速度提升45%，优化立方体切图算法，根据切图类型，选择最小尺寸的ImageData进行计算
- pref：及时销毁canvas元素，减少内存消耗
- pref：willReadFrequently: true，在频繁调用getImageData()时可以节省内存

