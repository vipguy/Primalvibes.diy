import React from 'react';

const WelcomeScreen = () => {
  return (
    <div className="bg-light-background-01 dark:bg-dark-background-01 flex h-full flex-col items-center justify-center">
      <img src="/lightup.png" alt="Lightup" className="logo-pulse h-auto w-full max-w-xs" />
    </div>
  );
};

export default WelcomeScreen;
