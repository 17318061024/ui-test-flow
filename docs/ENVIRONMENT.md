# 环境配置与安装指南

## 系统要求

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | 18.x | 20.x |
| JDK | 17 | 21 |
| Maven | 3.8 | 3.9.x |
| npm | 9.x | 10.x |
| 浏览器 | Chrome 90+ | Chrome 120+ |

## 前置软件安装

### 1. 安装 Node.js

#### macOS (使用 Homebrew)

```bash
# 安装 Homebrew (如果没有)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node@20

# 验证安装
node --version  # 应显示 v20.x.x
npm --version   # 应显示 10.x.x
```

#### Windows

1. 从 [Node.js 官网](https://nodejs.org/) 下载 LTS 版本
2. 运行安装程序，勾选 "Add to PATH"
3. 打开命令行验证：
   ```
   node --version
   npm --version
   ```

#### Linux (Ubuntu/Debian)

```bash
# 使用 nvm 安装 (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 验证
node --version
```

### 2. 安装 JDK 17

#### macOS

```bash
# 使用 Homebrew 安装
brew install openjdk@17

# 创建符号链接
sudo ln -sfn $(brew --prefix)/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk

# 设置环境变量 (添加到 ~/.zshrc 或 ~/.bashrc)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH

# 验证
java --version
```

#### Windows

1. 从 [Adoptium](https://adoptium.net/) 下载 JDK 17 (LTS)
2. 运行安装程序
3. 设置环境变量：
   ```
   JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x
   PATH=%JAVA_HOME%\bin;%PATH%
   ```

#### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# 验证
java --version
```

### 3. 安装 Maven

#### macOS

```bash
# 使用 Homebrew
brew install maven

# 验证
mvn --version
```

#### Windows

1. 从 [Maven 官网](https://maven.apache.org/) 下载二进制包
2. 解压到 `C:\Program Files\Apache\maven`
3. 设置环境变量：
   ```
   MAVEN_HOME=C:\Program Files\Apache\maven
   PATH=%MAVEN_HOME%\bin;%PATH%
   ```

## 项目启动

### 方式一：分别启动前后端

#### 1. 启动后端

```bash
cd ui-test-flow/backend

# 使用 Maven 启动 (首次运行会下载依赖，需要几分钟)
mvn spring-boot:run

# 或者先编译再运行
mvn clean compile
mvn spring-boot:run
```

后端启动成功后，访问 http://localhost:3001/api/flows 验证

#### 2. 启动前端

```bash
cd ui-test-flow/frontend

# 安装依赖 (首次)
npm install

# 启动开发服务器
npm run dev
```

前端启动成功后，访问 http://localhost:5173

### 方式二：使用根目录脚本

```bash
# 安装根目录依赖 (如果需要)
npm install

# 同时启动前后端
npm run dev:all
```

## 常见问题

### 后端问题

#### 1. 端口被占用

```bash
# 查找占用 3001 端口的进程
lsof -i :3001

# 杀掉进程
kill -9 <PID>

# 或者修改端口
# 编辑 backend/src/main/resources/application.properties
# server.port=3002
```

#### 2. Maven 下载依赖慢

修改 Maven 镜像源：

```xml
<!-- ~/.m2/settings.xml -->
<mirrors>
  <mirror>
    <id>aliyun</id>
    <mirrorOf>*</mirrorOf>
    <url>https://maven.aliyun.com/repository/public</url>
  </mirror>
</mirrors>
```

#### 3. JDK 版本不对

```bash
# 检查 Java 版本
java --version
javac --version

# 设置正确的 JAVA_HOME
export JAVA_HOME=/path/to/jdk-17
export PATH=$JAVA_HOME/bin:$PATH
```

### 前端问题

#### 1. npm install 失败

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

#### 2. 端口被占用

```bash
# 查找占用 5173 端口的进程
lsof -i :5173

# 杀掉进程
kill -9 <PID>
```

#### 3. TypeScript 编译错误

```bash
# 确保使用正确版本的 TypeScript
npm install typescript@5.3.0 --save-dev

# 清理并重新编译
rm -rf node_modules/.cache
npm run build
```

## 环境变量配置

### 后端 (application.properties)

```properties
# 服务端口
server.port=3001

# 流程文件存储目录 (相对于项目根目录)
flow.directory=../flows

# 测试用例输出目录
output.directory=../output
```

### 前端 (.env)

```bash
# API 基础路径
VITE_API_BASE=http://localhost:3001
```

## Docker 部署 (可选)

### 后端 Dockerfile

```dockerfile
FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY backend/target/*.jar app.jar
EXPOSE 3001
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 前端 Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

## 目录结构说明

```
ui-test-flow/
├── backend/              # Java 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/    # Java 源码
│   │       └── resources/
│   │           └── application.properties  # 配置文件
│   ├── target/          # 编译输出
│   └── pom.xml          # Maven 配置
│
├── frontend/            # Vue 前端项目
│   ├── src/
│   │   ├── api/        # API 调用
│   │   ├── components/  # Vue 组件
│   │   ├── stores/      # Pinia 状态
│   │   ├── types/       # TypeScript 类型
│   │   └── views/       # 页面视图
│   ├── dist/            # 构建输出
│   ├── node_modules/    # npm 依赖
│   └── package.json     # npm 配置
│
├── flows/               # 流程文件存储
│   └── *.json          # 流程 JSON 文件
│
├── output/              # 测试用例输出
│   └── test-cases.json # 生成的测试用例
│
└── docs/               # 项目文档
```

## 验证安装

1. 后端验证：
   ```bash
   curl http://localhost:3001/api/flows
   # 应返回: []
   ```

2. 前端验证：
   - 打开浏览器访问 http://localhost:5173
   - 应该看到流程列表页面

3. 创建测试流程：
   - 点击"新建流程"
   - 从左侧拖拽节点到画布
   - 连接节点
   - 点击"保存"
   - 刷新页面确认流程已保存
