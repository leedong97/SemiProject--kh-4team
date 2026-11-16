import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/shop/", // 🔴 수정: 배포된 이커머스 파일을 /shop/ 기준으로 불러오기
});