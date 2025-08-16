/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // 忽略WebSocket的可选依赖警告
      config.externals = [...(config.externals || []), {
        'bufferutil': 'bufferutil',
        'utf-8-validate': 'utf-8-validate',
      }];
    }
    return config;
  },
};

module.exports = nextConfig;
