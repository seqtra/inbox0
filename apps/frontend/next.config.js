//@ts-check
const { composePlugins, withNx } = require('@nx/next');
const path = require('path');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
  },
  // FIX 1: Explicitly transpile the shared library
  transpilePackages: ['@email-whatsapp-bridge/shared'],
  
  // FIX 2: Strict Webpack Aliases to force Single React Instance
  webpack: (config) => {
    const rootNodeModules = path.resolve(__dirname, '../../node_modules');
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': path.resolve(rootNodeModules, 'react'),
      'react-dom': path.resolve(rootNodeModules, 'react-dom'),
      'react-redux': path.resolve(rootNodeModules, 'react-redux'),
      '@reduxjs/toolkit': path.resolve(rootNodeModules, '@reduxjs/toolkit'),
      // Force Next.js internals to use the same React
      'next/link': path.resolve(rootNodeModules, 'next/link'),
      'next/router': path.resolve(rootNodeModules, 'next/router'),
      'next/script': path.resolve(rootNodeModules, 'next/script'),
    };
    return config;
  },
};

const plugins = [withNx];

module.exports = composePlugins(...plugins)(nextConfig);