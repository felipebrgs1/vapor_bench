window.frameworkName = "Vue Vapor";
import "@shared/domScanner.js";
import { createApp, vaporInteropPlugin } from "vue";
import "./style.css";
import App from "./App.vue";

const app = createApp(App);
app.use(vaporInteropPlugin);
app.mount("#app");
