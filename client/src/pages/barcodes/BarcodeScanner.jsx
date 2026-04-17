import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineMagnifyingGlass, HiOutlineQrCode } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { lookupBarcode } from '../../services/barcode.service';

const BarcodeScanner = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const playSound = (success) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = success ? 800 : 300;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(ctx.currentTime + (success ? 0.1 : 0.3));
    } catch {}
  };

  const handleScan = async (e) => {
    e?.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const res = await lookupBarcode(code.trim());
      const data = res.data.data;
      setResult(data);

      if (data.found) {
        playSound(true);
        setHistory((prev) => [
          { code: code.trim(), product: data.product, timestamp: new Date() },
          ...prev.slice(0, 19),
        ]);
      } else {
        playSound(false);
        toast.error('No product found for this barcode');
      }
    } catch (err) {
      playSound(false);
      toast.error(err.response?.data?.error || 'Lookup failed');
      setResult(null);
    } finally {
      setLoading(false);
      setCode('');
      inputRef.current?.focus();
    }
  };

  return (
    <div>
      <PageHeader title="Barcode Scanner" subtitle="Scan or enter a barcode to look up products" />

      {/* Scan Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <form onSubmit={handleScan} className="flex items-center gap-3">
          <div className="relative flex-1">
            <HiOutlineQrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Scan barcode or type manually..."
              className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <HiOutlineMagnifyingGlass className="w-5 h-5" />
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </form>
      </div>

      {/* Result Card */}
      {result?.found && result.product && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-6">
            {result.product.image && (
              <img
                src={result.product.image}
                alt={result.product.name}
                className="w-24 h-24 rounded-lg object-cover border"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{result.product.name}</h3>
              <p className="text-sm text-gray-500 font-mono mt-1">SKU: {result.product.sku}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="font-medium">{result.product.category?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Brand</span>
                  <p className="font-medium">{result.product.brand?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Price</span>
                  <p className="font-medium text-green-600">
                    {result.product.sellingPrice?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Stock</span>
                  <p className={`font-medium ${(result.product.stock || 0) <= (result.product.alertQuantity || 5) ? 'text-red-600' : ''}`}>
                    {result.product.stock || 0}
                  </p>
                </div>
              </div>

              {result.variant && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">
                    Variant: {result.variant.name} (SKU: {result.variant.sku})
                  </p>
                  <p className="text-sm text-blue-600">Price: {result.variant.sellingPrice?.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scan History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Scan History</h3>
            <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:underline">Clear</button>
          </div>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-500">{h.code}</span>
                  <span className="font-medium">{h.product?.name}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {h.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
