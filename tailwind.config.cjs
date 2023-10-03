const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
    content: ['./src/**/*.{js,jsx}', './public/index.html'],
    theme: {
        extend: {
            colors: {
                Auth: '#4c66df26',
                white: '#fff',
                primary: '#006CD1',
                primary700: '#0084ff',
                primary900:'#085aa0',
                black: "#000",
                lightgrey:"#F4F4F4",
                input:"#505050",
                secondary:"#F48184",
                secondary300:'#f9a8aa',
                secondary500:'#e94a4e',
                accordianTitle:"#533A3A",
                activeAccordianbg:"#EBEBEB",
            },
            fontFamily: {
                primary: ["Heebo", ...defaultTheme.fontFamily.sans],
            },
            fontSize:{
                base: '14px',
            },
            height:{
              '48':'48px'
            },
            letterSpacing:{
                tightest:'0.7px'
            }
        },
    },
    plugins: [
        require('tw-elements/dist/plugin'),
       require("daisyui"),
    ],
};
