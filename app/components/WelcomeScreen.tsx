// Welcome screen component shown when no messages are present
const WelcomeScreen = () => {
  return (
    <div className="text-accent-02 mx-auto max-w-2xl space-y-4 px-12 pt-8 text-center italic">
      <h3 className="py-10 text-2xl font-semibold">Vibe coding just got easier</h3>

      <p>
        Describe your app and let AI write the code. If you need ideas, try the quick suggestions
        below or join our{' '}
        <a
          href="https://discord.gg/DbSXGqvxFc"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-00 hover:underline"
        >
          Discord community
        </a>
        .
      </p>

      <p className="mt-8 text-xs">
        Fork this{' '}
        <a
          href="https://github.com/fireproof-storage/ai-app-builder"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-00 hover:underline"
        >
          open source app builder
        </a>{' '}
        and create vibecode apps anywhere, no setup required.
      </p>
    </div>
  );
};

export default WelcomeScreen;
