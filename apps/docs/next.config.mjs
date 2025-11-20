import nextra from 'nextra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    mdxRs: false,
  },
  webpack: (config) => {
    // Add alias for MDX import source
    config.resolve.alias = {
      ...config.resolve.alias,
      'next-mdx-import-source-file': path.resolve(__dirname, './app/mdx-components.tsx'),
    }
    return config
  },
}

export default nextra({
  search: {
    codeblocks: false,
  },
})(nextConfig)

