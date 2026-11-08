import { useState } from 'react';
import { useGame } from '../../game/useGame';
import { ChallengePanel } from '../shared/ChallengePanel';
import { DecoderTools } from '../shared/DecoderTools';
import { FileTabs } from '../shared/FileTabs';
import { filesIn, readText } from '../terminal/files';

const files = filesIn('crypto');

/** Crypto notepad: a cipher file, the decoders, and the flag box for that file. */
export function CryptoApp() {
  const { game } = useGame();
  const [name, setName] = useState(files[0].name);
  const file = files.find((f) => f.name === name)!;
  const text = readText(file, game);

  return (
    <>
      <FileTabs names={files.map((f) => f.name)} selected={name} onSelect={setName} label="Files" />
      <pre className="crt-box">{text}</pre>
      <DecoderTools fileText={text} />
      <ChallengePanel key={file.challenge} challengeId={file.challenge!} />
    </>
  );
}
