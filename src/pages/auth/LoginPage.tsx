import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { loginSuccess } from '../../redux/slices/authSlice';
import { useAppDispatch } from '../../redux/hooks';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });

  const startCountdown = () => {
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (data: PhoneForm) => {
    setIsLoading(true);
    try {
      await authService.sendOTP(data.phone);
      setPhone(data.phone);
      setStep('otp');
      startCountdown();
      toast.success('OTP sent! Use 123456 for demo');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 4) { toast.error('Enter the 4-digit OTP'); return; }
    setIsLoading(true);
    try {
      const { user, token, refreshToken } = await authService.verifyOTP(phone, otp);
      dispatch(loginSuccess({ user, token, refreshToken }));
      toast.success(`Welcome back, ${user.name}!`);
    } catch (e: any) {
      toast.error(e.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await authService.sendOTP(phone);
      startCountdown();
      toast.success('OTP resent!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md rounded-2xl p-8 shadow-2xl animate-scale-in"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4" style={{ background: 'var(--accent)' }}>
          A
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AdminOS</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {step === 'phone' ? 'Sign in to your admin panel' : 'Enter verification code'}
        </p>
      </div>

      {step === 'phone' ? (
        <form onSubmit={phoneForm.handleSubmit(handleSendOTP)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>🇮🇳 +91</span>
              <input
                {...phoneForm.register('phone')}
                className="input-field pl-16"
                placeholder="9876543210"
                type="tel"
              />
            </div>
            {phoneForm.formState.errors.phone && (
              <p className="text-xs text-red-500 mt-1">{phoneForm.formState.errors.phone.message}</p>
            )}
          </div>

          {/* <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            💡 <strong>Demo:</strong> Enter any phone number and use OTP <code className="font-mono bg-[var(--bg-secondary)] px-1 py-0.5 rounded">123456</code>
          </div> */}

          <button type="submit" className="btn btn-primary btn-lg w-full justify-center" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2" />
                </svg>
                Sending OTP...
              </span>
            ) : 'Send OTP →'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Code sent to <strong style={{ color: 'var(--text-primary)' }}>+91 {phone}</strong>
            </p>
          </div>

          {/* OTP inputs */}
          <div className="flex justify-center gap-2">
            {otpDigits.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: digit ? 'var(--accent)' : 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            ))}
          </div>

          <button
            className="btn btn-primary btn-lg w-full justify-center"
            onClick={handleVerifyOTP}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify & Sign In →'}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              className="btn btn-ghost p-0 text-sm"
              onClick={() => { setStep('phone'); setOtpDigits(['', '', '', '']); }}
            >
              ← Change number
            </button>
            <button
              className={`text-sm font-medium ${countdown > 0 ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}
              style={{ color: 'var(--accent)' }}
              onClick={handleResendOTP}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
