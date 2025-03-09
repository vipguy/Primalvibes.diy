import React from 'react';

const WelcomeScreen = () => {
  return (
    <div className="bg-light-background-01 dark:bg-dark-background-01 flex h-full flex-col items-center justify-center">
      <img
        src="/lightup.png"
        alt="Lightup"
        className="pulsing h-auto w-full max-w-xs"
        style={{
          width: '100%',
          height: 'auto',
          transform: 'rotate(-5deg)',
          animation: 'pulse 8s infinite',
        }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes pulse {
            0% {
              transform: rotate(-5deg) scale(1);
            }
            50% {
              transform: rotate(0deg) scale(1.05);
            }
            100% {
              transform: rotate(-5deg) scale(1);
            }
          }
          img.pulsing {
            animation: pulse 8s infinite;
          }
        `,
        }}
      />
    </div>
  );
};

export default WelcomeScreen;
