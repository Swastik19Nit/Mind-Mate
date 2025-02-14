import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'three', 
      '@react-three/fiber', 
      '@react-three/drei'
    ], 
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('three') || 
                id.includes('@react-three/fiber') || 
                id.includes('@react-three/drei')) {
              return 'three-vendor'
            }
            if (id.includes('react-router-dom')) {
              return 'router-vendor'
            }
            if (id.includes('react')) {
              return 'react-vendor'
            }
            return 'vendor'
          }
        }
      }
    }
  },
  commonjsOptions: {
    transformMixedEsModules: true,
  },
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr', '**/*.fbx']
})
