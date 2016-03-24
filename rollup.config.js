import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  entry: 'src/index.js',
  moduleName: 'rollup',
  globals: {
    'react': 'React',
  },
  plugins: [
    babel({
      presets: ['es2015-rollup', 'react', 'stage-0'],
    }),
    nodeResolve({
      jsnext: true,
      main: true,
      skip: ['react'],
    }),
    commonjs({
      include: 'node_modules/**',
    }),
  ],
};
