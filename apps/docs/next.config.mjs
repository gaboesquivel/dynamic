import nextra from 'nextra'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

export default nextra({
  search: {
    codeblocks: false,
  },
})(nextConfig)
