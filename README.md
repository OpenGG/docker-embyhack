# docker-embyhack

通过简单的 `docker-compose` 命令，快速搭建并激活您自己的 Emby 服务器。

> **小提醒**：如果您的经济条件允许，请购买 Emby Premiere 来支持开发者。

![working](working.jpg)

## 🚀 快速开始

此方法适合希望立即体验的用户，但公共验证服务器不保证稳定。

1.  **下载 Release**：从 [Releases 页面](https://github.com/fejich/docker-embyhack/releases) 下载最新的 `docker-embyhack.zip` 文件。
2.  **解压文件**：解压后，您会得到 `docker-compose.yml` 文件和一个 `system/` 文件夹。
3.  **修改配置**：修改 `docker-compose.yml` 文件，主要是映射您的媒体库路径。
4.  **启动服务**：在文件所在目录，运行 `docker-compose up -d` 命令，即可启动 Emby 服务。

**⚠️ 注意**

> 预设包内置的默认验证地址 `https://mb3admin.megm.workers.dev/` **不保证长期可用**（可能因 DNS 污染、服务商限制等原因失效）。  
> 为了获得稳定体验，可以使用下面的**自定义构建**方法。

## 🛠️ 自定义构建

此方法通过您自己的 GitHub 账户和 Cloudflare Worker 创建专属的验证服务，稳定可靠。

#### 步骤 1：创建您自己的验证服务器

最简单的方式是使用 Cloudflare Worker：

1.  登录您的 Cloudflare 账户，进入 "Workers & Pages" 并创建一个新的 Worker。
2.  将本项目 [mocks/worker.js](./mocks/worker.js) 文件中的代码**完整复制**到 Worker 中。
3.  保存并部署该 Worker，得到一个专属的 URL。 请**务必在 URL 末尾加上斜杠 `/`**，最终格式为 `https://your-worker.your-name.workers.dev/`。
4. （可选）如果 `workers.dev` 域名在你的区域不可用，可以在 Worker 后台绑定自定义域名。

#### 步骤 2：通过 GitHub Actions 自定义构建

1.  **Fork 本仓库**：点击页面右上角的 "Fork" 按钮，将此项目复制到您自己的 GitHub 账户下。
2.  **触发构建**：在 Fork 后的仓库页面，进入 "Actions" 标签页，选择 "Release" 工作流，点击 "Run workflow"。
3.  **输入参数**：在 `your_mb3admin_replacement_url` 输入框中，填入上一步创建的 Cloudflare Worker URL。
4.  **下载产物**：等待 Action 运行完成，下载打包好的 `docker-embyhack.zip` 文件。

#### 步骤 3：部署

解压 `docker-embyhack.zip`，修改 `docker-compose.yml` 配置后，执行 `docker-compose up -d` 启动即可。

-----

## ⚙️ 配置说明

在启动服务前，您需要修改 `docker-compose.yml` 文件，将服务器上的媒体路径挂载到容器中。

请修改 `volumes` 部分，将 `/path/to/your/movies` 和 `/path/to/your/tvshows` 替换为您服务器上的真实路径。

```yaml
services:
  emby:
    # ... 其他配置 ...
    volumes:
          # emby 的配置目录
      - ./config:/config

      # 按需配置媒体目录
      - ./data:/data
      - ./path/to/your/movies:/movies # 电影媒体库，请修改为您的实际路径
      - ./path/to/your/tvshows:/tv # 电视剧媒体库，请修改为您的实际路径

      # 以下为系统数据，请勿修改
      - ./system/Emby.Web.dll:/app/emby/system/Emby.Web.dll:ro
      ...
```

-----

## ❓ 常见问题 (FAQ)

**Q1: 为什么需要替换验证服务器？**

A: Emby 客户端与服务器默认会向 `mb3admin.com` 发送请求以验证 Emby Premiere 许可证。

本项目通过将此请求重定向到一个模拟的验证服务器来激活功能。您可以选择使用公共服务器，或为了稳定性自行搭建。

**Q2: 关于“Support Emby”的提示？**

A: 进入 Emby 后台管理页面时，会在“设置”中看到一个“Support Emby”的提示。

请放心，这个提示**可以随时折叠**，并且**不会在播放页面显示**，完全不影响正常使用。

添加此提示仅为提醒大家，如果条件允许，请多多支持正版。
