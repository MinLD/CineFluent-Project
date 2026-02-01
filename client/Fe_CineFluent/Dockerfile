# Giai đoạn 1: Cài đặt Dependencies
# Sử dụng base image Node.js phiên bản 22.12.0
FROM node:22.12.0-alpine AS dependencies

# Thiết lập môi trường sản xuất
ENV NODE_ENV=production

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies cho môi trường sản xuất
RUN npm install --production

# ---

# Giai đoạn 2: Build ứng dụng
FROM node:22.12.0-alpine AS builder

WORKDIR /app

# Sao chép dependencies đã được cài đặt từ giai đoạn trước
COPY --from=dependencies /app/node_modules ./node_modules
# Sao chép toàn bộ mã nguồn của dự án
COPY . .

# Build ứng dụng Next.js
RUN npm run build

# ---

# Giai đoạn 3: Chạy ứng dụng (Production)
# Sử dụng base image Alpine nhỏ gọn nhất có thể
FROM node:22.12.0-alpine AS runner

WORKDIR /app

# Thiết lập môi trường sản xuất
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Tạo một user riêng để chạy ứng dụng (tăng tính bảo mật)
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Sao chép thư mục .next đã được build ở dạng standalone
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./

# Sao chép thư mục public và .next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

# Chuyển sang user đã tạo
USER nextjs

# Mở cổng 3000 để bên ngoài có thể truy cập vào
EXPOSE 3000

# Lệnh để khởi động server Next.js
CMD ["node", "server.js"]