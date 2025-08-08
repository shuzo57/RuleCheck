import React, { useState, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import MainApp from './components/MainApp';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {isLoggedIn ? (
        <MainApp onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
