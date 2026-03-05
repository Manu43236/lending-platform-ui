import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { antdTheme } from './theme'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'

dayjs.extend(relativeTime)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={antdTheme}>
        <AntApp>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AntApp>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
)
