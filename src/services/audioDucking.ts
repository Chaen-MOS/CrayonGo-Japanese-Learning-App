type DuckingHandlers = {
  duck: () => void;
  restore: () => void;
};

let handlers: DuckingHandlers | null = null;

export const registerAudioDuckingHandlers = (nextHandlers: DuckingHandlers | null) => {
  handlers = nextHandlers;
};

export const duckBackgroundAudio = () => {
  handlers?.duck();
};

export const restoreBackgroundAudio = () => {
  handlers?.restore();
};
