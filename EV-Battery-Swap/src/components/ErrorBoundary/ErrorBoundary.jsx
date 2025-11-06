import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // log to console for now
    console.error('ErrorBoundary caught', error, info);
    if (typeof window !== 'undefined' && window?.Sentry) {
      try { window.Sentry.captureException(error); } catch (e) {}
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 12, background: '#fff3f2', color: '#7f1d1d', borderRadius: 8 }}>
          <strong>Map failed to load.</strong>
          <div style={{ marginTop: 8 }}>{String(this.state.error?.message || this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
