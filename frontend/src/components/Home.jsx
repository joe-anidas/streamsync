import { useNavigate } from "react-router-dom";
import bgImage from './img/bg.jpg';

const Home = () => {
  const navigate = useNavigate();

  // Internal CSS with unique home-specific class names
  const styles = {
    homeWrapper: {
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '16px',
      backgroundColor: '#f8f9fa'
    },
    homeCard: {
      width: '100%',
      maxWidth: '400px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      transition: 'transform 300ms ease, box-shadow 300ms ease',
      animation: 'fadeIn 0.4s ease-out'
    },
    homeHeading: {
      fontSize: '1.75rem',
      fontWeight: '700',
      margin: '0 0 24px',
      textAlign: 'center',
      color: '#2c3e50'
    },
    homeButtonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    homeLoginBtn: {
      display: 'block',
      width: '100%',
      padding: '16px',
      fontSize: '1rem',
      fontWeight: '600',
      textAlign: 'center',
      color: '#ffffff',
      backgroundColor: '#4a6bff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 200ms ease, transform 200ms ease'
    },
    homeRegisterBtn: {
      display: 'block',
      width: '100%',
      padding: '16px',
      fontSize: '1rem',
      fontWeight: '600',
      textAlign: 'center',
      color: '#2c3e50',
      backgroundColor: '#fff',
      border: '1px solid #dee2e6',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 200ms ease, transform 200ms ease'
    }
  };

  // Additional styles for hover/active states and animations
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .home-login-btn:hover {
      background-color: #738aff;
      transform: translateY(-1px);
    }
    
    .home-login-btn:active {
      background-color: #3b55d9;
      transform: translateY(1px);
    }
    
    .home-register-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }
    
    .home-register-btn:active {
      transform: translateY(1px);
    }
    
    .home-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }
    
    @media (prefers-color-scheme: dark) {
      .home-wrapper {
        background-color: #344563;
      }
      
      .home-card {
        background-color: #2d3748;
      }
      
      .home-heading {
        color: #ffffff;
      }
      
      .home-register-btn {
        background-color: #3a4559;
        color: #ffffff;
        border-color: #4c5a75;
      }
    }
    
    @media (max-width: 480px) {
      .home-card {
        box-shadow: none;
        border-radius: 0;
        max-width: 100%;
      }
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div style={styles.homeWrapper} className="home-wrapper">
      <div style={styles.homeCard} className="home-card">
        <h2 style={styles.homeHeading}>Welcome to StreamSyncJJ</h2>
        <div style={styles.homeButtonContainer}>
          <button 
            style={styles.homeLoginBtn}
            className="home-login-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button 
            style={styles.homeRegisterBtn}
            className="home-register-btn"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;