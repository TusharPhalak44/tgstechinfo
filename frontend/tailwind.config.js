/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]', "class"],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#EAF2FF',
  				'100': '#D1E0FF',
  				'200': '#A3C1FF',
  				'300': '#75A3FF',
  				'400': '#4784FF',
  				'500': '#0B1F4D',
  				'600': '#123A8C',
  				'700': '#0F337A',
  				'800': '#0C2967',
  				'900': '#081F54'
  			},
  			accent: {
  				'50': '#FFF4E8',
  				'100': '#FFE8D1',
  				'200': '#FFD1A3',
  				'300': '#FFBA75',
  				'400': '#FFA347',
  				'500': '#F7941D',
  				'600': '#E67E00',
  				'700': '#C46A00',
  				'800': '#A25600',
  				'900': '#804200'
  			},
  			gray: {
  				'50': '#F8FAFC',
  				'100': '#F1F5F9',
  				'200': '#E2E8F0',
  				'300': '#CBD5E1',
  				'400': '#94A3B8',
  				'500': '#64748B',
  				'600': '#475569',
  				'700': '#334155',
  				'800': '#1E293B',
  				'900': '#0F172A'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI"',
  				'Roboto',
  				'Helvetica Neue"',
  				'Arial',
  				'sans-serif'
  			]
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem'
  		},
  		maxHeight: {
  			'128': '32rem'
  		},
  		minHeight: {
  			editor: '400px'
  		},
  		boxShadow: {
  			soft: '0 2px 8px rgba(11,31,77,0.08)',
  			medium: '0 4px 12px rgba(11,31,77,0.12)',
  			hard: '0 8px 24px rgba(11,31,77,0.15)'
  		},
  		borderRadius: {
  			xl: '12px',
  			'2xl': '16px'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
}