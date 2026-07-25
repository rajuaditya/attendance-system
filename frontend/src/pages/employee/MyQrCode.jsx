import { useCallback } from 'react';
import { Download } from 'lucide-react';
import { employeeApi } from '../../api/employee.api';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import Card from '../../components/common/Card.jsx';
import Loader from '../../components/common/Loader.jsx';
import { formatDate } from '../../utils/format.js';

const MyQrCode = () => {
  const { user } = useAuth();
  const fetcher = useCallback(() => employeeApi.getQrCode(user.id).then((r) => r.data.data), [user.id]);
  const { data, loading, error } = useFetch(fetcher, [fetcher]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-800 dark:text-slate-100">My QR Code</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Use this code to check in and out at the office kiosk</p>
      </div>

      <Card>
        {loading ? (
          <Loader />
        ) : error ? (
          <p className="text-status-absent">{error}</p>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <img src={data.qrImageDataUrl} alt="Your attendance QR code" className="h-64 w-64 rounded-xl2 border border-slate-100 dark:border-slate-800" />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.fullName}</p>
              <p className="text-xs text-slate-400">{user.employeeCode}</p>
            </div>
            <p className="text-xs text-slate-400">Valid until {formatDate(data.expiresAt)} — rotates automatically for security</p>
            <a href={data.qrImageDataUrl} download={`${user.employeeCode}-qr.png`} className="btn-secondary">
              <Download size={16} /> Download QR code
            </a>
          </div>
        )}
      </Card>

      <Card title="How it works">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
          <li>Your QR code contains only a secure, encrypted token — never your personal details.</li>
          <li>Scan it once in the morning to check in, and once in the evening to check out.</li>
          <li>The code automatically rotates periodically for your security.</li>
        </ul>
      </Card>
    </div>
  );
};

export default MyQrCode;
