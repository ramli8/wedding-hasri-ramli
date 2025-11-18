import Custom404 from '@/pages/404'
import Custom500 from '@/pages/500'
import { Component, ReactNode } from 'react'
import { ErrorPage } from './ErrorPage'

export class Error404 extends Error {
  constructor() {
    super('page_not_found')
  }
}

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: unknown }
> {
  constructor(props: { children: ReactNode }) {
    super(props)

    // Define a state variable to track whether is an error or not
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: unknown) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // You can use your own error logging service here
    // console.log({ error, errorInfo });
  }

  render() {
    // console.log('error boundary', { hasError: this.state.hasError });
    // Check if the error is thrown
    if (this.state.hasError) {
      const getLayout = ErrorPage.getLayout ?? ((page) => page)
      const is404 = this.state.error instanceof Error404
      const resetError = () => this.setState({ hasError: false, error: null })

      return getLayout(
        is404 ? (
          <Custom404 resetError={resetError} />
        ) : (
          <Custom500 resetError={resetError} />
        )
      )
    }

    // Return children components in case of no error
    return this.props.children
  }
}
