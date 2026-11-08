import { isLinkableAppId, type AppId } from '../apps/registry';

/** The app named in the address, e.g. #terminal, or null. */
export function readHashApp(): AppId | null {
  const id = decodeURIComponent(location.hash.slice(1));
  return isLinkableAppId(id) ? id : null;
}

/** Replaces the address without adding a history entry. Pass null for the plain address. */
export function replaceHash(id: AppId | null) {
  const url = id ? `#${id}` : `${location.pathname}${location.search}`;
  if (url !== `${location.pathname}${location.search}${location.hash}`) {
    history.replaceState(null, '', url);
  }
}
