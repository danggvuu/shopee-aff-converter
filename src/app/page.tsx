'use client';

import { useState } from 'react';
import { Link, Copy, CheckCircle2, AlertCircle, Loader2, Settings, ShieldCheck, X, Eye, EyeOff, KeyRound, Check } from 'lucide-react';

export default function Home() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Admin Modal States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [affiliateId, setAffiliateId] = useState('17365230043');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminMsg(null);

    try {
      const res = await fetch(`/api/admin/settings?secret=${encodeURIComponent(adminPass)}`);
      const data = await res.json();

      if (!data.success) {
        setAdminMsg({ type: 'error', text: data.error || 'Mật khẩu quản trị không đúng!' });
      } else {
        setAdminAuthed(true);
        if (data.affiliateId) {
          setAffiliateId(data.affiliateId);
        }
      }
    } catch (err) {
      setAdminMsg({ type: 'error', text: 'Lỗi kết nối máy chủ.' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          secret: adminPass, 
          affiliateId,
          newPassword: newAdminPass ? newAdminPass.trim() : undefined
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setAdminMsg({ type: 'error', text: data.error || 'Lỗi khi lưu cài đặt.' });
      } else {
        setAdminMsg({ type: 'success', text: '✅ Đã lưu cài đặt thành công!' });
        if (newAdminPass) {
          setAdminPass(newAdminPass.trim());
          setNewAdminPass('');
        }
      }
    } catch (err) {
      setAdminMsg({ type: 'error', text: 'Lỗi khi lưu cài đặt.' });
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative font-sans">
      <button
        onClick={() => {
          setShowAdminModal(true);
          setAdminMsg(null);
        }}
        className="absolute top-4 right-4 bg-white border border-gray-300 text-gray-700 hover:text-orange-500 hover:border-orange-400 p-2.5 rounded-full shadow transition cursor-pointer z-10"
        title="Cài đặt Quản trị viên (Admin)"
      >
        <Settings className="w-5 h-5" />
      </button>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-orange-500 p-6 text-center">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Link className="w-6 h-6" />
            Tạo link Shopee Săn Sale
          </h1>
          <p className="text-orange-100 mt-2 text-sm">Chuyển đổi link Shopee thường sang link tích hợp mã Affiliate</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Dán link sản phẩm Shopee vào đây
              </label>
              <input
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://shopee.vn/..."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-orange-500 outline-none transition text-gray-900 bg-white placeholder-gray-400 font-medium"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !inputUrl}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
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
            <div className="mt-6 p-4 border-2 border-green-300 bg-green-50 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Link Affiliate của bạn đã sẵn sàng!</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={resultUrl}
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-gray-900 text-sm font-semibold outline-none shadow-sm select-all"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-white border border-gray-300 hover:bg-orange-50 hover:text-orange-600 text-gray-800 p-2.5 rounded-xl transition shadow-sm active:scale-95 shrink-0 cursor-pointer"
                  title="Sao chép link"
                >
                  {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {copied && <p className="text-xs text-green-700 font-bold text-center">Đã sao chép vào bộ nhớ tạm!</p>}
            </div>
          )}
        </div>
      </div>

      {/* Modal Quản trị (Admin Settings) */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-200">
            <button
              onClick={() => {
                setShowAdminModal(false);
                setAdminAuthed(false);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-gray-900 font-bold text-lg mb-4">
              <ShieldCheck className="w-6 h-6 text-orange-500" />
              <span>Cài đặt Quản Trị Viên (Admin)</span>
            </div>

            {!adminAuthed ? (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Mật khẩu Quản Trị
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full px-3.5 py-2.5 pr-10 border-2 border-gray-300 rounded-xl outline-none focus:border-orange-500 text-gray-900 bg-white text-sm font-semibold placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {adminMsg && (
                  <div className={`p-2.5 rounded-lg text-xs font-bold ${adminMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {adminMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={adminLoading || !adminPass}
                  className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer"
                >
                  {adminLoading ? 'Đang kiểm tra...' : 'Xác thực'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1.5">
                    Shopee Affiliate ID đang dùng
                  </label>
                  <input
                    type="text"
                    required
                    value={affiliateId}
                    onChange={(e) => setAffiliateId(e.target.value)}
                    placeholder="VD: 17365230043"
                    className="w-full px-3.5 py-2.5 border-2 border-gray-300 rounded-xl outline-none focus:border-orange-500 font-mono text-gray-900 bg-white text-base font-bold"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mọi link tạo ra sẽ tự động gắn mã kiếm tiền của ID này.
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-orange-500" />
                    Đổi mật khẩu Admin mới (Tùy chọn)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newAdminPass}
                      onChange={(e) => setNewAdminPass(e.target.value)}
                      placeholder="Để trống nếu không muốn đổi pass"
                      className="w-full px-3.5 py-2.5 pr-10 border-2 border-gray-300 rounded-xl outline-none focus:border-orange-500 text-gray-900 bg-white text-sm font-semibold placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {adminMsg && (
                  <div className={`p-2.5 rounded-lg text-xs font-bold ${adminMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                    {adminMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={adminLoading || !affiliateId}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition shadow cursor-pointer active:scale-95"
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
