import { Component } from 'react';

// Vite/CRA React apps don't have Next.js's error.tsx per-route boundary,
// so this class component is the equivalent: it catches render-time crashes
// in whatever it wraps and shows a designed fallback instead of a blank screen.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Route crashed:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.wrap}>
          <h2 style={styles.title}>Kuch ghalat ho gaya</h2>
          <p style={styles.text}>
            Ye page load nahi ho saka. Dobara try karein, ya home par wapas jaayein.
          </p>
          <div style={styles.row}>
            <button style={styles.primaryBtn} onClick={this.handleReset}>
              Dobara try karein
            </button>
            <a href="/" style={styles.link}>Home</a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' },
  title: { margin: 0, fontSize: '1.2rem' },
  text: { color: '#666', maxWidth: '360px' },
  row: { display: 'flex', gap: '0.75rem', marginTop: '0.5rem' },
  primaryBtn: { padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#0084ff', color: 'white', cursor: 'pointer' },
  link: { padding: '0.6rem 1.2rem', color: '#0084ff', textDecoration: 'none' },
};

export default ErrorBoundary;