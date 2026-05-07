import path from "node:path";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({command}) => ({
    plugins: [react()],
    base: command === "serve" ? "/" : "/code-challenge/",
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
        },
    },
    build: {
        outDir: path.resolve(__dirname, "dist"),
        emptyOutDir: true,
    },
}));
