export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          hover: '#7c3aed',
        },
      },
    },
  },
  plugins: [],
};
