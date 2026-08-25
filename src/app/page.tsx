'use client';

import { useState } from 'react';
import { Link, Copy, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function Home() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResultUrl('');
    setLoading(true);
    setCopied(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      } else {
        setResultUrl(data.data.shortUrl);
      }
    } catch (err) {
      setError('Lỗi kết nối tới máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (resultUrl) {
      navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-orange-500 p-6 text-center">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Link className="w-6 h-6" />
            Tạo link Shopee Affiliate
          </h1>
          <p className="text-orange-100 mt-2 text-sm">Chuyển đổi link Shopee thường thành link kiếm tiền</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dán link sản phẩm Shopee vào đây
              </label>
              <input
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://shopee.vn/..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !inputUrl}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tạo link Affiliate'}
            </button>
          </form>

          {resultUrl && (
            <div className="mt-6 p-4 border border-green-200 bg-green-50 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Tạo link thành công!</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={resultUrl}
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 p-2 rounded-lg transition"
                  title="Copy link"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
