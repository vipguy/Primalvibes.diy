// Welcome screen component shown when no messages are present
import VibesDIYLogo from './VibesDIYLogo';

const WelcomeScreen = () => {
  return (
    <div className="text-accent-01 mx-auto max-w-2xl space-y-4 px-12 pt-8 text-center">
        <VibesDIYLogo className="font-bold scale-[3] sm:scale-[6]" />
      <p className="italic pt-24">
        Generate apps in seconds.
      </p>

      <p className="mt-8 text-xs italic text-accent-02">Share your apps with the{' '}
        <a
          href="https://discord.gg/DbSXGqvxFc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-00 hover:underline"
        >
          Discord community
        </a>
        {" "}
        and fork the 
        {" "}
        <a
          href="https://github.com/fireproof-storage/vibes.diy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-00 hover:underline"
        >builder repo</a>.
      </p>
    </div>
  );
};

export default WelcomeScreen;
