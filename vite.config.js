import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Big 3D models get locked while they're being exported; watching them crashed the dev server
  server: { port: 5181, watch: { ignored: ['**/public/models/**', '**/*.glb'] } },
});
