import { Component } from 'react'
import { Result, Button } from 'antd'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle={this.state.error?.message || 'An unexpected error occurred.'}
          extra={[
            <Button
              type="primary"
              key="reload"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>,
            <Button
              key="back"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.history.back()
              }}
            >
              Go Back
            </Button>,
          ]}
        />
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
