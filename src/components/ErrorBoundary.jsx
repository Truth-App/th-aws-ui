import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Send to monitoring service here in production
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <h1 style={styles.title}>Something went wrong.</h1>
            <p style={styles.text}>
              An unexpected error occurred while loading this part of the app.
            </p>
            <button style={styles.button} onClick={this.handleReload}>
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: '#f5f7fb',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    background: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 12px',
    fontSize: '28px',
    color: '#1f2937',
  },
  text: {
    margin: '0 0 20px',
    color: '#4b5563',
    lineHeight: 1.5,
  },
  button: {
    border: 'none',
    borderRadius: '10px',
    padding: '12px 18px',
    background: '#111827',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default ErrorBoundary;