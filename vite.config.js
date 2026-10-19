import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { handleApiRequest } from './server/apiHandler.js'

function adminApiPlugin() {
  return {
    name: 'admin-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const handled = await handleApiRequest(req, res)
        if (!handled) {
          next()
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), adminApiPlugin()],
})
