// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#173D49',
        secondary: '#D6AD60',
        accent: '#E9B872',
        background: '#F8F9F7',
        heading: '#172B32',
        bodyText: '#68777B',
        border: '#E5E9E7',
        success: '#228B62',
        error: '#DC5353',
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
