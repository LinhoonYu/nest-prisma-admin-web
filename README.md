# nest-prisma-admin-web

基于 Vue 3 + Vite + TypeScript + Element Plus 构建的企业级后台管理系统前端。

> **在线演示**：https://npa.ylhcode.top  
> 账号：`demo` / 密码：`123456`

本项目是 [nest-prisma-admin](https://github.com/LinhoonYu/nest-prisma-admin) 的配套前端，对接其后端 API。

## 技术栈

| 技术 | 说明 |
|---|---|
| Vue 3.5 | Composition API + `<script setup>` |
| Vite 8 | 构建工具 |
| TypeScript 5.9 | 类型安全 |
| Element Plus 2.13 | UI 组件库 |
| Pinia 3 | 状态管理 |
| Vue Router 5 | 路由管理 |
| Vue I18n 11 | 国际化（中/英） |
| UnoCSS | 原子化 CSS |
| Socket.IO Client | WebSocket 实时通知 |
| ECharts 6 | 图表 |
| VXE Table 4 | 高性能表格 |
| WangEditor | 富文本编辑器 |

## 环境要求

| 依赖 | 版本要求 |
|---|---|
| Node.js | `>= 20.19.0`（推荐 22 LTS） |
| pnpm | `>= 9` |

## 快速开始

```bash
# 克隆项目
git clone https://github.com/LinhoonYu/nest-prisma-admin-web.git
cd nest-prisma-admin-web

# 安装依赖
pnpm install

# 启动开发服务
pnpm dev
```

启动后访问 `http://localhost:5173`。

> [!IMPORTANT]
> 前端需要配合后端 [nest-prisma-admin](https://github.com/LinhoonYu/nest-prisma-admin) 一起使用，请先启动后端服务（默认端口 3000）。后端启动方式见后端项目 README。

## 配置说明

开发环境配置文件 `.env.development`：

```env
VITE_APP_PORT=5173
VITE_APP_TITLE=nest-prisma-admin-web
VITE_APP_BASE_API=/dev-api
VITE_APP_API_URL=http://127.0.0.1:3000
VITE_MOCK_DEV_SERVER=false
```

如果后端地址或端口不同，修改 `VITE_APP_API_URL` 即可。

## 常用脚本

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务 |
| `pnpm build` | 构建生产包（含类型检查） |
| `pnpm preview` | 预览构建产物 |
| `pnpm type-check` | 类型检查 |
| `pnpm lint` | ESLint + Prettier + Stylelint 全量检查 |
| `pnpm commit` | 交互式 Conventional Commit |

## 致谢

本项目基于 [youlaitech/vue3-element-admin](https://github.com/youlaitech/vue3-element-admin) 修改适配，感谢原作者的开源贡献。

## License

[MIT](LICENSE)
