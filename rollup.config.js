import resolve from 'rollup-plugin-node-resolve';
import commonJs from 'rollup-plugin-commonjs';

module.exports = {
  input: 'src/lib/app.mjs',
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].[hash].js',
    chunkFileNames: '[name].[hash].js',
  },
  plugins: [
    resolve(),
    commonJs({
      include: 'node_modules/**',
    }),
  ],
};