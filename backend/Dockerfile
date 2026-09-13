FROM node:18-alpine

WORKDIR /app

# 复制 package.json 并安装依赖
COPY package.json ./
RUN npm install --production

# 复制源码
COPY src ./src

# 创建上传目录
RUN mkdir -p /app/uploads

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=uploads

EXPOSE 3000

CMD ["node", "src/app.js"]
