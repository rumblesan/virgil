import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    include: ['./src/**/*.test.js'],
    setupFiles: ['./test/init.js'],
  },
})
