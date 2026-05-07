import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Simula el navegador para probar componentes React
    environment: "jsdom",
    // Permite usar describe/it/expect sin importarlos en cada archivo
    globals: true,
    // Archivo que se ejecuta antes de cada suite de pruebas
    setupFiles: ["./src/setupTests.js"],
    // Muestra el nombre de cada prueba al ejecutar
    reporters: ["verbose"],
  },
});
