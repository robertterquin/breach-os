import { useId, useState } from 'react';
import { ChallengePanel } from '../shared/ChallengePanel';
import { FileTabs } from '../shared/FileTabs';
import { pageAt } from '../terminal/files';
import './LabExplorer.css';

const challengeIds = ['web/01', 'web/02'];

/** What a browser would draw: tags and comments hidden, text kept. */
const rendered = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<input[^>]*>/g, '[_____]')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

/** Lab Explorer: an old browser for the lab intranet, with view-source. */
export function LabExplorer() {
  const [typed, setTyped] = useState('lab07.local/');
  const [address, setAddress] = useState('lab07.local/');
  const [source, setSource] = useState(false);
  const [answering, setAnswering] = useState(challengeIds[0]);
  const addressId = useId();
  const page = pageAt(address);
  const isHtml = typeof page === 'string' && /^<!doctype|^<html/i.test(page.trim());

  return (
    <>
      <form
        className="explorer__bar"
        onSubmit={(event) => {
          event.preventDefault();
          setAddress(typed);
        }}
      >
        <label htmlFor={addressId}>Address</label>
        <input
          id={addressId}
          className="field explorer__address"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button type="submit" className="btn">
          Go
        </button>
        <button
          type="button"
          className="btn"
          aria-pressed={source}
          onClick={() => setSource((s) => !s)}
        >
          View source
        </button>
      </form>

      {page === 'no-host' ? (
        <p className="explorer__page">This page cannot be displayed. Only lab07.local answers.</p>
      ) : page === 'not-found' ? (
        <p className="explorer__page">404 Not Found</p>
      ) : source ? (
        <pre className="crt-box">{page}</pre>
      ) : (
        <pre className="explorer__page">{isHtml ? rendered(page) || ' ' : page}</pre>
      )}

      <FileTabs
        names={challengeIds}
        selected={answering}
        onSelect={setAnswering}
        label="Answering"
      />
      <ChallengePanel key={answering} challengeId={answering} />
    </>
  );
}
