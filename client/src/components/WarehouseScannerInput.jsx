import { useState, useRef, useEffect } from 'react';
import { HiOutlineQrCode } from 'react-icons/hi2';
import { scanBarcode } from '../services/warehouseOps.service';

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

const WarehouseScannerInput = ({
  onScan,
  disabled = false,
  continuousScan = true,
  soundFeedback = true,
  placeholder = 'Scan or enter product barcode...',
}) => {
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const handleScan = async (e) => {
    e?.preventDefault();
    const barcode = code.trim();
    if (!barcode || scanning) return;

    setScanning(true);
    try {
      const res = await scanBarcode(barcode);
      const product = res.data.data;
      if (soundFeedback) playSound(true);
      onScan?.(product, barcode);
    } catch {
      if (soundFeedback) playSound(false);
    } finally {
      setScanning(false);
      setCode('');
      if (continuousScan) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  };

  return (
    <form onSubmit={handleScan} className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
      <HiOutlineQrCode className="w-6 h-6 text-gray-400 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || scanning}
        className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none disabled:opacity-50"
        autoComplete="off"
      />
      <button
        type="submit"
        disabled={disabled || scanning || !code.trim()}
        className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {scanning ? 'Scanning...' : 'Scan'}
      </button>
    </form>
  );
};

export default WarehouseScannerInput;
