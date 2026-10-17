import { STORE_CATALOG } from '../../domain/stores/catalog';
import { buildAddPurchaseUrl, resolveQrOrigin } from '../../domain/stores/qr-url';
import { QrCode } from './QrCode';

export default function QrPrintPage() {
  const origin = resolveQrOrigin(import.meta.env.VITE_PUBLIC_ORIGIN, window.location.origin);
  const localOnly = origin.includes('localhost') || origin.includes('127.0.0.1');
  const cards = STORE_CATALOG.map((store) => ({
    store,
    url: buildAddPurchaseUrl(origin, store.slug),
  }));

  return (
    <main id="main" className="page">
      <h2 className="panel-title">Store QR codes</h2>
      <div className="no-print qr-intro">
        <p>Print a code and scan it with the phone camera. The add screen opens with that store selected and the amount empty.</p>
        <p>Each code contains only the store link.</p>
        <p className="hint">Encoded origin: {origin}</p>
        {localOnly && (
          <p className="notice">
            These codes point at this computer. To scan with a phone, open this page using the computer&apos;s network address, then print.
          </p>
        )}
        <button type="button" className="button button-primary print-button" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <div className="qr-grid">
        {cards.map(({ store, url }) => (
          <article key={store.slug} className="qr-card">
            <h3 className="qr-name">{store.name}</h3>
            <QrCode value={url} label={store.name} />
            <p className="qr-url">{url}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
