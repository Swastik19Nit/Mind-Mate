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
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('three') || 
                id.includes('@react-three/fiber') || 
                id.includes('@react-three/drei')) {
              return 'three-vendor'
            }
            if (id.includes('react')) {
              return 'react-vendor'
            }
            return 'vendor' // other dependencies
          }
        }
      }
    }
  },
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr', '**/*.fbx']
})