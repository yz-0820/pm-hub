# PM Hub Prototype Importer

Figma 插件，用于把 PM Hub `/tools/prototype` 生成的 `prototypeSpec` 导入为可编辑 Figma 图层。

## 本地安装

1. 打开 Figma Desktop。
2. 进入 `Plugins -> Development -> Import plugin from manifest...`。
3. 选择本目录下的 `manifest.json`。
4. 在任意 Figma 文件中运行 `PM Hub Prototype Importer`。

## 使用方式

1. 在 PM Hub 打开 `/tools/prototype`。
2. 填写原型信息并生成预览。
3. 复制页面显示的导入码。
4. 在 Figma 插件中填写 PM Hub 地址和导入码。
5. 点击导入，插件会在当前 Figma 文件中创建可编辑图层。

## 注意

- 本地开发时 PM Hub 地址默认为 `http://localhost:3000`。
- 线上部署后，将 PM Hub 地址改为实际域名。
- 导入码默认 30 分钟后过期。
- 插件生成的是中保真可编辑图层，不是一张图片。
