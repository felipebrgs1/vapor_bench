import "@shared/domScanner.js";
import { createVaporApp } from "@vue/runtime-vapor";
import "./style.css";
import App from "./App.vue";

createVaporApp(App).mount("#app");
