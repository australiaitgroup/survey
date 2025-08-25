# Docker 方式：nginx-with-super-admin/Dockerfile
FROM nginx:alpine

# 复制自定义配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY sigma.jiangren.com.au.conf /etc/nginx/conf.d/default.conf

# 复制静态文件（如果需要）
# COPY html/ /usr/share/nginx/html/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
