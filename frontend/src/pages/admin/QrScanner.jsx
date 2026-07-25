import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { LogIn, LogOut, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { qrApi } from '../../api/attendance.api';
import Card from '../../components/common/Card.jsx';
import { Button } from '../../components/common/FormControls.jsx';

const SCANNER_ID = 'qr-reader';

const QrScanner = () => {
  const [scanType, setScanType] = useState('check_in');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { success, message, employeeName }
  const [busy, setBusy] = useState(false);
  const scannerRef = useRef(null);
  const scanTypeRef = useRef(scanType);
  const busyRef = useRef(false);

  useEffect(() => {
    scanTypeRef.current = scanType;
  }, [scanType]);

  const handleScanSuccess = async (decodedText) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const { data } = await qrApi.scan(decodedText, scanTypeRef.current);
      setResult({
        success: true,
        message: data.message,
        employeeName: data.data.employee?.fullName,
      });
    } catch (err) {
      setResult({
        success: false,
        message: err?.response?.data?.message || 'Scan failed. Please try again.',
      });
    } finally {
      setBusy(false);
      // Allow next scan after a short cooldown so the same QR isn't re-read repeatedly
      setTimeout(() => {
        busyRef.current = false;
      }, 2000);
    }
  };

  const startScanner = async () => {
    setResult(null);
    const html5Qrcode = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = html5Qrcode;
    try {
      await html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {} // ignore per-frame scan failures (expected while searching)
      );
      setScanning(true);
    } catch (err) {
      setResult({ success: false, message: 'Unable to access camera. Check browser permissions.' });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        /* scanner already stopped */
      }
    }
    setScanning(false);
  };

  useEffect(() => () => { stopScanner(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">QR Attendance Scanner</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Point the camera at an employee's QR code to mark attendance</p>
      </div>

      <Card>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setScanType('check_in')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              scanType === 'check_in' ? 'bg-status-present text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <LogIn size={16} /> Check In
          </button>
          <button
            onClick={() => setScanType('check_out')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              scanType === 'check_out' ? 'bg-status-late text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <LogOut size={16} /> Check Out
          </button>
        </div>

        <div
          id={SCANNER_ID}
          className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl2 bg-slate-900"
        />

        <div className="mt-4 flex justify-center">
          {!scanning ? (
            <Button onClick={startScanner}>
              <Camera size={16} /> Start Camera
            </Button>
          ) : (
            <Button variant="secondary" onClick={stopScanner}>Stop Camera</Button>
          )}
        </div>

        {result && (
          <div
            className={`mt-4 flex items-start gap-3 rounded-xl p-4 ${
              result.success ? 'bg-status-present/10' : 'bg-status-absent/10'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="mt-0.5 shrink-0 text-status-present" size={20} />
            ) : (
              <XCircle className="mt-0.5 shrink-0 text-status-absent" size={20} />
            )}
            <div>
              {result.employeeName && (
                <p className="font-semibold text-slate-800 dark:text-slate-100">{result.employeeName}</p>
              )}
              <p className={`text-sm ${result.success ? 'text-status-present' : 'text-status-absent'}`}>{result.message}</p>
            </div>
          </div>
        )}

        {busy && <p className="mt-2 text-center text-xs text-slate-400">Processing scan…</p>}
      </Card>
    </div>
  );
};

export default QrScanner;
