// Prisma 7 Configuration File
import { defineConfig } from "@prisma/config"
import { config } from "dotenv"

// Load .env file
config()

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
