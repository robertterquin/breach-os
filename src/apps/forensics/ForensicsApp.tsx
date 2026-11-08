import { useId, useState } from 'react';
import { useGame } from '../../game/useGame';
import { ChallengePanel } from '../shared/ChallengePanel';
import { DecoderTools } from '../shared/DecoderTools';
import { FileTabs } from '../shared/FileTabs';
import { extractStrings, filesIn, readText } from '../terminal/files';
import './ForensicsApp.css';

/** Forensics viewer: a photo with its properties, a memory dump, and hidden files. */
export function ForensicsApp() {
  const { game } = useGame();
  const [showHidden, setShowHidden] = useState(false);
  const files = filesIn('forensics', { hidden: showHidden });
  const [name, setName] = useState(files[0].name);
  const file = files.find((f) => f.name === name) ?? files[0];
  const [properties, setProperties] = useState(false);
  const [strings, setStrings] = useState(false);
  const hiddenId = useId();
  const text = readText(file, game);

  const select = (next: string) => {
    setName(next);
    setProperties(false);
    setStrings(false);
  };

  return (
    <>
      <div className="forensics__bar">
        <FileTabs
          names={files.map((f) => f.name)}
          selected={file.name}
          onSelect={select}
          label="Files"
        />
        <label htmlFor={hiddenId} className="forensics__hidden">
          <input
            id={hiddenId}
            type="checkbox"
            checked={showHidden}
            onChange={(event) => {
              setShowHidden(event.target.checked);
              if (!event.target.checked && file.name.startsWith('.'))
                select(filesIn('forensics')[0].name);
            }}
          />
          Show hidden files
        </label>
      </div>

      {file.exif ? (
        <>
          <figure className="forensics__photo">
            {/* The image is decorative; its caption carries everything a player needs. */}
            <div className="forensics__desk" aria-hidden="true">
              <span className="forensics__note" />
            </div>
            <figcaption>{file.exif.find(([key]) => key === 'Description')?.[1]}</figcaption>
          </figure>
          <button
            type="button"
            className="btn"
            aria-pressed={properties}
            onClick={() => setProperties((p) => !p)}
          >
            Properties
          </button>
          {properties && (
            <table className="forensics__props">
              <tbody>
                {file.exif.map(([key, value]) => (
                  <tr key={key}>
                    <th scope="row">{key}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : file.binary ? (
        <>
          <pre className="crt-box crt-box--dim forensics__dump">{text}</pre>
          <button
            type="button"
            className="btn"
            aria-pressed={strings}
            onClick={() => setStrings((s) => !s)}
          >
            Run strings
          </button>
          {strings && <pre className="crt-box">{extractStrings(text).join('\n')}</pre>}
        </>
      ) : (
        <pre className="crt-box">{text}</pre>
      )}

      <DecoderTools fileText={file.binary || file.exif ? undefined : text} />
      <ChallengePanel key={file.challenge} challengeId={file.challenge!} />
    </>
  );
}
