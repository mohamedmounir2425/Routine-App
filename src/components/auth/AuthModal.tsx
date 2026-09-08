import React, { useState } from 'react';
import { useAuth, AuthModalMode } from '../../context/AuthContext';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff,
  ArrowRight
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    setAuthModalMode,
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    isConfigured 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const resetFormState = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(false);
  };

  const handleSwitchMode = (mode: AuthModalMode) => {
    resetFormState();
    setAuthModalMode(mode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني');
      return;
    }

    if (authModalMode !== 'forgot' && !password) {
      setErrorMsg('يرجى إدخال كلمة المرور');
      return;
    }

    if (authModalMode === 'signup' && password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authModalMode === 'signin') {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) {
          if (error.message?.includes('Invalid login credentials')) {
            setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          } else if (error.message?.includes('Email not confirmed')) {
            setErrorMsg('يرجى تأكيد بريدك الإلكتروني من خلال الرابط المرسل إليك');
          } else {
            setErrorMsg(error.message || 'فشل تسجيل الدخول، يرجى المحاولة لاحقاً');
          }
        }
      } else if (authModalMode === 'signup') {
        const { error, data } = await signUpWithEmail(email.trim(), password, fullName.trim());
        if (error) {
          if (error.message?.includes('already registered')) {
            setErrorMsg('هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول');
          } else {
            setErrorMsg(error.message || 'فشل إنشاء الحساب');
          }
        } else {
          // If email confirmation is required by Supabase:
          if (data?.user && !data.session) {
            setSuccessMsg('تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتأكيد التسجيل.');
          } else {
            setSuccessMsg('تم إنشاء حسابك وتسجيل الدخول بنجاح!');
            setTimeout(() => {
              closeAuthModal();
            }, 1200);
          }
        }
      } else if (authModalMode === 'forgot') {
        const { error } = await resetPassword(email.trim());
        if (error) {
          setErrorMsg(error.message || 'فشل إرسال رابط استعادة كلمة المرور');
        } else {
          setSuccessMsg('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Background Decorative Glow Orbs */}
      <div className="absolute w-80 h-80 rounded-full bg-emerald-500/20 blur-[100px] -top-20 -right-20 pointer-events-none" />
      <div className="absolute w-72 h-72 rounded-full bg-teal-500/15 blur-[90px] -bottom-20 -left-20 pointer-events-none" />

      {/* Modal Container */}
      <div 
        className="liquid-glass-card rounded-[32px] w-full max-w-md p-6 sm:p-8 border border-white/15 relative z-10 shadow-2xl overflow-hidden font-['Tajawal']"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 left-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center">
              <Cloud className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {authModalMode === 'signin' && 'تسجيل الدخول'}
            {authModalMode === 'signup' && 'إنشاء حساب جديد'}
            {authModalMode === 'forgot' && 'استعادة كلمة المرور'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            لمزامنة تمارينك وروتيناتك وإحصائياتك بين اللاب توب والموبايل
          </p>
        </div>

        {/* Warning if Supabase is not configured */}
        {!isConfigured && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">مفاتيح Supabase غير مفعلة</p>
              <p className="text-amber-200/80 text-[11px] mt-0.5">
                يرجى التأكد من إضافة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env
              </p>
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs (Sign In / Sign Up) */}
        {authModalMode !== 'forgot' && (
          <div className="flex rounded-2xl bg-white/5 p-1 mb-5 border border-white/10">
            <button
              type="button"
              onClick={() => handleSwitchMode('signin')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authModalMode === 'signin'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('signup')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authModalMode === 'signup'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              حساب جديد
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalMode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">الاسم الكامل</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد منير"
                  className="w-full pr-10 pl-3 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                className="w-full pr-10 pl-3 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all text-left"
              />
            </div>
          </div>

          {authModalMode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">كلمة المرور</label>
                {authModalMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('forgot')}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pr-10 pl-10 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isConfigured}
            className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {authModalMode === 'signin' && 'دخول والمزامنة'}
                  {authModalMode === 'signup' && 'إنشاء الحساب وبدء المزامنة'}
                  {authModalMode === 'forgot' && 'إرسال رابط الاستعادة'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Back to sign in if forgot */}
        {authModalMode === 'forgot' && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => handleSwitchMode('signin')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mx-auto transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لتسجيل الدخول</span>
            </button>
          </div>
        )}

        {/* Guest Mode Footer */}
        <div className="mt-5 pt-4 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={closeAuthModal}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
          >
            المتابعة كضيف محلياً دون مزامنة ➜
          </button>
        </div>
      </div>
    </div>
  );
};
