/*import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})*/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'
import { resolve } from 'path'

export default defineConfig({
    plugins: [
        react({
            jsxRuntime: 'automatic' // Важно для библиотек
        }),
        libInjectCss(),
        dts({
            include: ['src'],
            insertTypesEntry: true,
            exclude: ['src/main.tsx'] // исключаем демо приложение
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'CorpChatLibrary',
            fileName: 'index',
            formats: ['es']
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                'antd',
                '@ant-design/icons',
                'axios',
                'socket.io-client',
                'emoji-picker-react',
                'react-draggable'
            ],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'antd': 'antd',
                    '@ant-design/icons': 'icons',
                    'axios': 'axios',
                    'socket.io-client': 'io',
                    'emoji-picker-react': 'EmojiPickerReact',
                    'react-draggable': 'Draggable'
                }
            }
        }
    }
})