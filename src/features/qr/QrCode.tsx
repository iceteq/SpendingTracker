import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { sanitizeQrSvg } from '../../domain/stores/qr-url';

export function QrCode({ value, label }: { value: string; label: string }) {
  const [markup, setMarkup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'Q',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((svg: string) => {
        if (!cancelled) setMarkup(sanitizeQrSvg(svg));
      })
      .catch(() => {
        if (!cancelled) setMarkup(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="qr-frame" role="img" aria-label={`QR code for ${label}`}>
      {markup ? <div dangerouslySetInnerHTML={{ __html: markup }} /> : <p className="hint">QR code unavailable</p>}
    </div>
  );
}
