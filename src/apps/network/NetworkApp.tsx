import { useId, useState } from 'react';
import { useGame } from '../../game/useGame';
import { ChallengePanel } from '../shared/ChallengePanel';
import { DecoderTools } from '../shared/DecoderTools';
import { FileTabs } from '../shared/FileTabs';
import { filesIn, readText } from '../terminal/files';

const files = filesIn('network');

/** Log viewer: pick a log, filter its rows, decode what looks odd. */
export function NetworkApp() {
  const { game } = useGame();
  const [name, setName] = useState(files[0].name);
  const [filter, setFilter] = useState('');
  const filterId = useId();
  const file = files.find((f) => f.name === name)!;
  const [header, ...rows] = readText(file, game).split('\n');
  const needle = filter.trim().toLowerCase();
  const shown = needle ? rows.filter((row) => row.toLowerCase().includes(needle)) : rows;

  return (
    <>
      <FileTabs names={files.map((f) => f.name)} selected={name} onSelect={setName} label="Logs" />
      <div className="file-tabs">
        <label htmlFor={filterId}>Filter</label>
        <input
          id={filterId}
          className="field"
          value={filter}
          placeholder="10.0.7.12"
          onChange={(event) => setFilter(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <span role="status">
          {shown.length} of {rows.length} rows
        </span>
      </div>
      <pre className="crt-box">{[header, ...shown].join('\n')}</pre>
      <DecoderTools />
      <ChallengePanel key={file.challenge} challengeId={file.challenge!} />
    </>
  );
}
