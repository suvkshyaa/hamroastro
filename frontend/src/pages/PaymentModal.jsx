import React, { useState, useEffect } from 'react';
import { IoClose, IoCheckmarkCircle, IoWarning } from 'react-icons/io5';
import { FaQrcode, FaCopy, FaCheck } from 'react-icons/fa';

export default function PaymentModal({ isOpen, onClose, onPaymentSubmit, amount = 20 }) {
  const [step, setStep] = useState(1); // 1 = QR, 2 = Enter ID, 3 = Confirm
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setTransactionId('');
        setError('');
        setLoading(false);
        setCopied(false);
      }, 300);
    }
  }, [isOpen]);

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!transactionId.trim()) {
        setError('कृपया Transaction ID हाल्नुहोस्');
        return;
      }
      if (transactionId.trim().length < 6) {
        setError('Transaction ID कम्तिमा 6 अक्षर हुनुपर्छ');
        return;
      }
      setError('');
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await onPaymentSubmit(transactionId.trim());
      setTransactionId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Payment verification failed. Please try again.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  if (!isOpen) return null;

  const steps = ['Scan QR', 'Enter ID', 'Confirm'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={handleClose}
    >
      <div
        className="w-full sm:max-w-sm bg-[#111b21] rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-white font-semibold text-base">Complete Payment</h2>
            <p className="text-gray-400 text-xs mt-0.5">प्रश्न पठाउन भुक्तानी गर्नुहोस्</p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
          >
            <IoClose size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center px-5 pb-4 gap-0">
          {steps.map((label, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isDone ? 'bg-[#00a884] text-white' :
                    isActive ? 'bg-[#005c4b] text-[#00a884] border border-[#00a884]' :
                    'bg-[#202c33] text-gray-500'
                  }`}>
                    {isDone ? <FaCheck size={10} /> : num}
                  </div>
                  <span className={`text-[10px] mt-1 ${isActive || isDone ? 'text-[#00a884]' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-1 mb-4 transition-all ${step > num ? 'bg-[#00a884]' : 'bg-[#2a3942]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Amount Badge */}
        <div className="mx-5 mb-4 bg-[#005c4b]/30 border border-[#00a884]/20 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-[11px]">Payment Amount</p>
            <p className="text-[#00a884] text-xl font-bold">NPR {amount}.00</p>
          </div>
          <button
            onClick={handleCopyAmount}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-[#202c33] px-3 py-1.5 rounded-lg transition"
          >
            {copied ? <FaCheck size={11} className="text-[#00a884]" /> : <FaCopy size={11} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Step 1 — QR Code */}
        {step === 1 && (
          <div className="px-5 pb-2">
            <div className="bg-[#202c33] rounded-xl p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-3">
                <FaQrcode size={14} className="text-[#00a884]" />
                <span className="text-white text-sm font-medium">Fonepay QR Code</span>
              </div>

              <div className="bg-white rounded-xl p-3 w-44 h-44 flex items-center justify-center">
                <img
                  src="/qr.jpg"
                  alt="Fonepay QR Code"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div style="text-align:center;color:#888;padding:8px;">
                        <div style="font-size:36px;margin-bottom:6px;">📷</div>
                        <p style="font-size:11px;margin:0;">Place qr.jpg in</p>
                        <p style="font-size:11px;margin:0;">frontend/public/</p>
                      </div>
                    `;
                  }}
                />
              </div>

              <p className="text-gray-400 text-xs mt-3">Hamro Astro — Fonepay</p>
            </div>

            <div className="mt-3 space-y-2">
              {[
                { n: '1', text: 'Fonepay app खोल्नुहोस्' },
                { n: '2', text: 'QR Code स्क्यान गर्नुहोस्' },
                { n: '3', text: `NPR ${amount} भुक्तानी गर्नुहोस्` },
                { n: '4', text: 'Transaction ID नोट गर्नुहोस्' },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#005c4b] text-[#00a884] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {n}
                  </div>
                  <p className="text-gray-300 text-xs">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Enter Transaction ID */}
        {step === 2 && (
          <div className="px-5 pb-2">
            <div className="bg-[#202c33] rounded-xl p-4">
              <p className="text-white text-sm font-medium mb-1">Transaction ID</p>
              <p className="text-gray-400 text-xs mb-3">
                Fonepay बाट प्राप्त Transaction ID हाल्नुहोस्
              </p>

              <input
                type="text"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setError('');
                }}
                placeholder="e.g. FP2024XXXXXXXX"
                autoFocus
                className="w-full bg-[#111b21] text-white rounded-lg px-4 py-3 text-sm focus:outline-none placeholder-gray-600"
                style={{
                  border: `1px solid ${error ? '#ef4444' : transactionId.length >= 6 ? '#00a884' : 'rgba(255,255,255,0.1)'}`,
                }}
                disabled={loading}
              />

              <div className="flex items-center justify-between mt-2">
                <span className={`text-[11px] ${error ? 'text-red-400' : 'text-gray-500'}`}>
                  {error || 'Minimum 6 characters required'}
                </span>
                <span className={`text-[11px] font-medium ${transactionId.trim().length >= 6 ? 'text-[#00a884]' : 'text-gray-500'}`}>
                  {transactionId.trim().length} chars
                </span>
              </div>
            </div>

            <div className="mt-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex gap-2">
              <IoWarning size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-300/80 text-[11px] leading-relaxed">
                गलत Transaction ID दिनुभयो भने प्रश्न रद्द हुनेछ। Fonepay app बाट सही ID राख्नुहोस्।
              </p>
            </div>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <div className="px-5 pb-2">
            <div className="bg-[#202c33] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <IoCheckmarkCircle size={18} className="text-[#00a884]" />
                <p className="text-white text-sm font-medium">Confirm Payment Details</p>
              </div>

              <div className="space-y-0">
                <div className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-gray-400 text-xs">Amount Paid</span>
                  <span className="text-[#00a884] font-semibold text-sm">NPR {amount}.00</span>
                </div>
                <div className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-gray-400 text-xs">Payment Method</span>
                  <span className="text-white text-xs">Fonepay QR</span>
                </div>
                <div className="flex justify-between items-start py-2.5">
                  <span className="text-gray-400 text-xs">Transaction ID</span>
                  <span className="text-white text-xs font-mono text-right max-w-[180px] break-all">
                    {transactionId.trim()}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-2">
                <IoWarning size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="px-5 pt-4 pb-6 flex gap-3 mt-2">
          {step > 1 && (
            <button
              onClick={() => { setStep(step - 1); setError(''); }}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-300 bg-[#202c33] hover:bg-[#2a3942] transition disabled:opacity-40"
            >
              ← Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 2 && transactionId.trim().length < 6}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#00a884] hover:bg-[#06cf9c] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 1 ? 'I have paid →' : 'Review →'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-[#00a884] hover:bg-[#06cf9c] transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Confirm & Send Question ✓'
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}