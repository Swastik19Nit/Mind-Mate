// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      external: ['react-router-dom'],
      output: {
        manualChunks: {
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          'react-vendor': ['react', 'react-dom'],
        }
      }
    },
    optimizeDeps: {
      include: ['three', '@react-three/fiber', '@react-three/drei']
    }
  },
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr', '**/*.fbx'],
})