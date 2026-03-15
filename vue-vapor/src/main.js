window.frameworkName = "Vue Vapor";
import "@shared/domScanner.js";
import { createVaporApp } from "@vue/runtime-vapor";
import "./style.css";
import App from "./App.vue";

// Initializing the Vapor App without the core Vue package to prevent VDOM inclusion
createVaporApp(App).mount("#app");
