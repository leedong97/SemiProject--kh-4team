import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/main.css";

// React 앱의 시작 지점: index.html의 #root에 App을 연결합니다.
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
