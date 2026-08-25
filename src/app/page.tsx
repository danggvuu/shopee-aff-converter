'use client';

import { useState, useEffect } from 'react';
import { Link, Copy, CheckCircle2, AlertCircle, Loader2, Settings, ShieldCheck, X } from 'lucide-react';

export default function Home() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Admin Modal States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [affiliateId, setAffiliateId] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Check Admin Pass & Load Current ID
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminMsg(null);

    try {
      const res = await fetch(`/api/admin/settings?secret=${encodeURIComponent(adminPass)}`);
      const data = await res.json();

      if (!data.success) {
        setAdminMsg({ type: 'error', text: data.error || 'Sai mật khẩu Admin!' });
      } else {
        setAdminAuthed(true);
        setAffiliateId(data.affiliateId || '17365230043');
      }
    } catch (err) {
      setAdminMsg({ type: 'error', text: 'Không thể kết nối máy chủ.' });
    } finally {
      setAdminLoading(false);
    }
  };

  // Save new Affiliate ID
  const handleSaveAffiliateId = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: adminPass, affiliateId }),
      });
      const data = await res.json();

      if (!data.success) {
        setAdminMsg({ type: 'error', text: data.error || 'Lỗi khi lưu cài đặt.' });
      } else {
        setAdminMsg({ type: 'success', text: 'Đã lưu Affiliate ID mới thành công!' });
      }
    } catch (err) {
      setAdminMsg({ type: 'error', text: 'Lỗi khi lưu cài đặt.' });
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex items-center justify-center p-4 relative">
      {/* Nút Admin Settings góc trên */}
      <button
        onClick={() => {
          setShowAdminModal(true);
          setAdminMsg(null);
        }}
        className="absolute top-4 right-4 bg-white/80 backdrop-blur border border-gray-200 text-gray-600 hover:text-orange-500 hover:border-orange-300 p-2.5 rounded-full shadow-sm transition"
        title="Cài đặt Quản trị viên (Admin)"
      >
        <Settings className="w-5 h-5" />
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-orange-500 p-6 text-center relative">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Link className="w-6 h-6" />
            Tạo link Shopee Săn Sale
          </h1>
          <p className="text-orange-100 mt-2 text-sm">Chuyển đổi link Shopee thường sang link tích hợp mã Affiliate</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Dán link sản phẩm Shopee vào đây
              </label>
              <input
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://shopee.vn/..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-gray-800 placeholder-gray-400"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-start gap-2 text-sm animate-fadeIn">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !inputUrl}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tạo link...</span>
                </>
              ) : (
                'Tạo link Affiliate'
              )}
            </button>
          </form>

          {resultUrl && (
            <div className="mt-6 p-4 border border-green-200 bg-green-50/80 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Link Affiliate của bạn đã sẵn sàng!</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={resultUrl}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-gray-800 text-sm font-medium outline-none shadow-sm select-all"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-white border border-gray-200 hover:bg-orange-50 hover:text-orange-600 text-gray-700 p-2.5 rounded-xl transition shadow-sm active:scale-95 shrink-0"
                  title="Sao chép link"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {copied && <p className="text-xs text-green-600 font-medium text-center">Đã sao chép vào bộ nhớ tạm!</p>}
            </div>
          )}
        </div>
      </div>

      {/* Modal Quản trị (Admin Settings) */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-4">
              <ShieldCheck className="w-6 h-6 text-orange-500" />
              <span>Cài đặt Quản Trị Viên</span>
            </div>

            {!adminAuthed ? (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Nhập mật khẩu Admin
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="Mặc định: admin123"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>

                {adminMsg && (
                  <p className={`text-xs ${adminMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {adminMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={adminLoading || !adminPass}
                  className="w-full bg-gray-900 hover:bg-black text-white font-medium py-2.5 rounded-xl text-sm transition"
                >
                  {adminLoading ? 'Đang kiểm tra...' : 'Xác thực'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveAffiliateId} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                    Shopee Affiliate ID đang dùng
                  </label>
                  <input
                    type="text"
                    required
                    value={affiliateId}
                    onChange={(e) => setAffiliateId(e.target.value)}
                    placeholder="VD: 17365230043"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Mọi link tạo ra sẽ tự động gắn mã kiếm tiền của ID này.
                  </p>
                </div>

                {adminMsg && (
                  <p className={`text-xs ${adminMsg.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {adminMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={adminLoading || !affiliateId}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow"
                >
                  {adminLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
