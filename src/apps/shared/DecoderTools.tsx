import { useId, useState } from 'react';
import * as decoders from '../terminal/decode';
import './DecoderTools.css';

type Kind = 'caesar' | 'base64' | 'base32' | 'vigenere' | 'reverse' | 'url' | 'hex';

const labels: Record<Kind, string> = {
  caesar: 'Caesar shift',
  base64: 'Base64',
  base32: 'Base32',
  vigenere: 'Vigenère',
  reverse: 'Reverse',
  url: 'URL decode',
  hex: 'Hex',
};

/** The same decoders as the terminal's `decode`, with the file's text one click away. */
export function DecoderTools({ fileText }: { fileText?: string }) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState<Kind>('caesar');
  const [arg, setArg] = useState('');
  const [output, setOutput] = useState<{ ok: boolean; text: string } | null>(null);
  const ids = { text: useId(), kind: useId(), arg: useId() };
  const needsArg = kind === 'caesar' || kind === 'vigenere';

  const decode = () => {
    if (!text.trim()) return setOutput({ ok: false, text: 'Paste or load some text first.' });
    try {
      if (kind === 'caesar') {
        const shift = Number(arg);
        if (!arg.trim() || !Number.isInteger(shift)) {
          return setOutput({ ok: false, text: 'Enter how many places to shift back, e.g. 3.' });
        }
        return setOutput({ ok: true, text: decoders.caesar(text, shift) });
      }
      if (kind === 'vigenere') return setOutput({ ok: true, text: decoders.vigenere(text, arg) });
      return setOutput({ ok: true, text: decoders[kind](text) });
    } catch (error) {
      setOutput({ ok: false, text: (error as Error).message });
    }
  };

  return (
    <section className="decoder" aria-label="Decoder tools">
      <div className="decoder__row">
        <label htmlFor={ids.text}>Text to decode</label>
        {fileText !== undefined && (
          <button type="button" className="btn" onClick={() => setText(fileText)}>
            Use file text
          </button>
        )}
      </div>
      <textarea
        id={ids.text}
        className="field decoder__text"
        rows={2}
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
      />
      <div className="decoder__row">
        <label htmlFor={ids.kind}>Decoder</label>
        <select
          id={ids.kind}
          className="field"
          value={kind}
          onChange={(event) => setKind(event.target.value as Kind)}
        >
          {(Object.keys(labels) as Kind[]).map((k) => (
            <option key={k} value={k}>
              {labels[k]}
            </option>
          ))}
        </select>
        {needsArg && (
          <>
            <label htmlFor={ids.arg}>{kind === 'caesar' ? 'Shift back' : 'Key'}</label>
            <input
              id={ids.arg}
              className="field decoder__arg"
              value={arg}
              onChange={(event) => setArg(event.target.value)}
              inputMode={kind === 'caesar' ? 'numeric' : 'text'}
              autoComplete="off"
              spellCheck={false}
            />
          </>
        )}
        <button type="button" className="btn" onClick={decode}>
          Decode
        </button>
      </div>
      {output && (
        <p className={`crt-box ${output.ok ? '' : 'decoder__error'}`} role="status">
          {output.text}
        </p>
      )}
    </section>
  );
}
