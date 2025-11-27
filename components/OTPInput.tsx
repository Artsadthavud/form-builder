import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Language, OTPConfig, TranslatableText } from '../types';
import { getText } from '../utils/i18n';

interface OTPInputProps {
  id: string;
  type: 'phone_otp' | 'email_otp';
  value: string;
  onChange: (value: string) => void;
  onVerified?: (verified: boolean) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  currentLanguage: Language;
  otpConfig?: OTPConfig;
  countryCode?: string;
  error?: string;
}

type OTPStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error';

interface OTPState {
  status: OTPStatus;
  otpCode: string;
  countdown: number;
  attempts: number;
  errorMessage: string;
  canResend: boolean;
}

const OTPInput: React.FC<OTPInputProps> = memo(({
  id,
  type,
  value,
  onChange,
  onVerified,
  label,
  placeholder,
  required = false,
  disabled = false,
  currentLanguage,
  otpConfig,
  countryCode,
  error
}) => {
  const [state, setState] = useState<OTPState>({
    status: 'idle',
    otpCode: '',
    countdown: 0,
    attempts: 0,
    errorMessage: '',
    canResend: true
  });

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Config values with defaults
  const config = {
    otpLength: otpConfig?.otpLength || 6,
    expireSeconds: otpConfig?.expireSeconds || 300,
    resendDelaySeconds: otpConfig?.resendDelaySeconds || 60,
    maxAttempts: otpConfig?.maxAttempts || 3,
    sendOtpEndpoint: otpConfig?.sendOtpEndpoint || '',
    verifyOtpEndpoint: otpConfig?.verifyOtpEndpoint || '',
    valueFieldName: otpConfig?.valueFieldName || (type === 'phone_otp' ? 'phone' : 'email'),
    otpFieldName: otpConfig?.otpFieldName || 'otp',
    requestHeaders: otpConfig?.requestHeaders || {}
  };

  // Texts
  const texts = {
    sendOtp: {
      th: 'ส่ง OTP',
      en: 'Send OTP'
    },
    resend: {
      th: 'ส่งอีกครั้ง',
      en: 'Resend'
    },
    sending: {
      th: 'กำลังส่ง...',
      en: 'Sending...'
    },
    verify: {
      th: 'ยืนยัน',
      en: 'Verify'
    },
    verifying: {
      th: 'กำลังยืนยัน...',
      en: 'Verifying...'
    },
    verified: {
      th: '✓ ยืนยันแล้ว',
      en: '✓ Verified'
    },
    otpSent: {
      th: 'ส่ง OTP แล้ว',
      en: 'OTP sent'
    },
    enterOtp: {
      th: 'กรอกรหัส OTP',
      en: 'Enter OTP code'
    },
    expireIn: {
      th: 'หมดอายุใน',
      en: 'Expires in'
    },
    seconds: {
      th: 'วินาที',
      en: 'seconds'
    },
    resendIn: {
      th: 'ส่งใหม่ได้ใน',
      en: 'Resend in'
    },
    attempts: {
      th: 'ครั้ง',
      en: 'attempts'
    },
    remaining: {
      th: 'เหลือ',
      en: 'remaining'
    },
    maxAttemptsReached: {
      th: 'ครบจำนวนครั้งที่ลองแล้ว กรุณารอสักครู่',
      en: 'Maximum attempts reached. Please wait.'
    },
    invalidOtp: {
      th: 'รหัส OTP ไม่ถูกต้อง',
      en: 'Invalid OTP code'
    },
    networkError: {
      th: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      en: 'Network error occurred'
    },
    phonePlaceholder: {
      th: 'เบอร์โทรศัพท์',
      en: 'Phone number'
    },
    emailPlaceholder: {
      th: 'อีเมล',
      en: 'Email address'
    },
    configError: {
      th: 'ยังไม่ได้ตั้งค่า OTP API',
      en: 'OTP API not configured'
    }
  };

  // Countdown timer
  useEffect(() => {
    if (state.countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          countdown: prev.countdown - 1,
          canResend: prev.countdown - 1 <= 0 ? true : prev.canResend
        }));
      }, 1000);
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [state.countdown]);

  // Format countdown to mm:ss
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Send OTP
  const handleSendOtp = useCallback(async () => {
    if (!value || disabled || !state.canResend) return;

    // Check if API is configured
    if (!config.sendOtpEndpoint) {
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: texts.configError[currentLanguage]
      }));
      return;
    }

    setState(prev => ({ ...prev, status: 'sending', errorMessage: '' }));

    try {
      const response = await fetch(config.sendOtpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.requestHeaders
        },
        body: JSON.stringify({
          [config.valueFieldName]: value
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setState(prev => ({
        ...prev,
        status: 'sent',
        countdown: config.resendDelaySeconds,
        canResend: false,
        errorMessage: ''
      }));

      // Focus OTP input
      setTimeout(() => otpInputRef.current?.focus(), 100);

    } catch (err) {
      console.error('Send OTP failed:', err);
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: texts.networkError[currentLanguage]
      }));
    }
  }, [value, disabled, state.canResend, config, currentLanguage]);

  // Verify OTP
  const handleVerifyOtp = useCallback(async () => {
    if (!state.otpCode || state.otpCode.length !== config.otpLength || disabled) return;

    // Check rate limiting
    if (state.attempts >= config.maxAttempts) {
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: texts.maxAttemptsReached[currentLanguage]
      }));
      return;
    }

    // Check if API is configured
    if (!config.verifyOtpEndpoint) {
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: texts.configError[currentLanguage]
      }));
      return;
    }

    setState(prev => ({ ...prev, status: 'verifying', errorMessage: '' }));

    try {
      const response = await fetch(config.verifyOtpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.requestHeaders
        },
        body: JSON.stringify({
          [config.valueFieldName]: value,
          [config.otpFieldName]: state.otpCode
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && (data.success !== false)) {
        setState(prev => ({
          ...prev,
          status: 'verified',
          errorMessage: ''
        }));
        onVerified?.(true);
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          attempts: prev.attempts + 1,
          errorMessage: data.message || texts.invalidOtp[currentLanguage]
        }));
        onVerified?.(false);
      }

    } catch (err) {
      console.error('Verify OTP failed:', err);
      setState(prev => ({
        ...prev,
        status: 'error',
        attempts: prev.attempts + 1,
        errorMessage: texts.networkError[currentLanguage]
      }));
      onVerified?.(false);
    }
  }, [state.otpCode, state.attempts, config, value, currentLanguage, onVerified]);

  // Handle OTP input change
  const handleOtpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, config.otpLength);
    setState(prev => ({ ...prev, otpCode: newValue }));
  }, [config.otpLength]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (state.otpCode.length === config.otpLength && state.status === 'sent') {
      // Small delay before auto-verify
      const timer = setTimeout(() => {
        handleVerifyOtp();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.otpCode, state.status, config.otpLength, handleVerifyOtp]);

  const isVerified = state.status === 'verified';
  const isSending = state.status === 'sending';
  const isVerifying = state.status === 'verifying';
  const showOtpInput = ['sent', 'verifying', 'error'].includes(state.status) && !isVerified;
  const remainingAttempts = config.maxAttempts - state.attempts;

  const baseInputClass = "border border-slate-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm p-2 bg-white";

  return (
    <div id={id} className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input + Send Button Row */}
      <div className="flex gap-2">
        {/* Country code for phone */}
        {type === 'phone_otp' && countryCode && (
          <input 
            type="text"
            value={countryCode}
            disabled
            className="w-16 bg-slate-100 rounded-md shadow-sm text-sm border border-slate-300 p-2 text-center"
            aria-label="Country code"
          />
        )}

        {/* Email/Phone input */}
        <input 
          type={type === 'phone_otp' ? 'tel' : 'email'}
          placeholder={placeholder || texts[type === 'phone_otp' ? 'phonePlaceholder' : 'emailPlaceholder'][currentLanguage]}
          className={`flex-1 ${baseInputClass} ${isVerified ? 'bg-green-50 border-green-300' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isVerified}
          aria-describedby={`${id}-status`}
          aria-invalid={state.status === 'error'}
        />

        {/* Send OTP Button */}
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={disabled || !value || !state.canResend || isVerified || isSending}
          className={`px-4 py-2 text-sm rounded-md transition-all whitespace-nowrap font-medium
            ${isVerified 
              ? 'bg-green-100 text-green-700 cursor-default' 
              : isSending
                ? 'bg-slate-300 text-slate-500 cursor-wait'
                : state.canResend
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          aria-label={state.status === 'idle' ? texts.sendOtp[currentLanguage] : texts.resend[currentLanguage]}
        >
          {isSending ? (
            <>
              <span className="inline-block animate-spin mr-1">⏳</span>
              {texts.sending[currentLanguage]}
            </>
          ) : isVerified ? (
            texts.verified[currentLanguage]
          ) : !state.canResend ? (
            `${formatCountdown(state.countdown)}`
          ) : state.status === 'sent' || state.status === 'error' ? (
            `🔄 ${texts.resend[currentLanguage]}`
          ) : (
            `📤 ${texts.sendOtp[currentLanguage]}`
          )}
        </button>
      </div>

      {/* OTP Input + Verify Row */}
      {showOtpInput && (
        <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
          <input 
            ref={otpInputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={texts.enterOtp[currentLanguage]}
            className={`flex-1 ${baseInputClass} tracking-[0.5em] text-center font-mono text-lg
              ${state.status === 'error' ? 'border-red-300 bg-red-50' : ''}`}
            value={state.otpCode}
            onChange={handleOtpChange}
            maxLength={config.otpLength}
            disabled={disabled || isVerifying}
            aria-label={texts.enterOtp[currentLanguage]}
            autoComplete="one-time-code"
          />

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={disabled || state.otpCode.length !== config.otpLength || isVerifying}
            className={`px-4 py-2 text-sm rounded-md transition-all whitespace-nowrap font-medium
              ${isVerifying
                ? 'bg-slate-300 text-slate-500 cursor-wait'
                : state.otpCode.length === config.otpLength
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            aria-label={texts.verify[currentLanguage]}
          >
            {isVerifying ? (
              <>
                <span className="inline-block animate-spin mr-1">⏳</span>
                {texts.verifying[currentLanguage]}
              </>
            ) : (
              `✓ ${texts.verify[currentLanguage]}`
            )}
          </button>
        </div>
      )}

      {/* Status messages */}
      <div id={`${id}-status`} className="space-y-1">
        {/* Countdown and info */}
        {(state.status === 'sent' || state.status === 'error') && !isVerified && (
          <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
            <span>
              OTP {config.otpLength} {currentLanguage === 'th' ? 'หลัก' : 'digits'}
            </span>
            {state.countdown > 0 && (
              <span className="text-indigo-600 font-medium">
                {texts.resendIn[currentLanguage]} {formatCountdown(state.countdown)}
              </span>
            )}
            {remainingAttempts < config.maxAttempts && (
              <span className={`font-medium ${remainingAttempts <= 1 ? 'text-red-600' : 'text-amber-600'}`}>
                • {texts.remaining[currentLanguage]} {remainingAttempts} {texts.attempts[currentLanguage]}
              </span>
            )}
          </p>
        )}

        {/* Success message */}
        {isVerified && (
          <p className="text-sm text-green-600 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {currentLanguage === 'th' ? 'ยืนยันตัวตนสำเร็จ' : 'Verification successful'}
          </p>
        )}

        {/* Error message */}
        {state.errorMessage && (
          <p className="text-sm text-red-600 font-medium flex items-center gap-1" role="alert">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {state.errorMessage}
          </p>
        )}

        {/* External error */}
        {error && !state.errorMessage && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
});

OTPInput.displayName = 'OTPInput';

export default OTPInput;
