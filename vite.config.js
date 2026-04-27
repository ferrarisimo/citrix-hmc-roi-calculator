import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages'

export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? '/citrix-hmc-roi-calculator/' : './',
})
