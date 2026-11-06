import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// .jsx 파일의 React JSX 문법을 브라우저가 실행할 수 있게 변환합니다.
export default defineConfig({
  plugins: [react()],
});
