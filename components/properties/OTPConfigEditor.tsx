import React, { memo, useCallback } from 'react';
import { FormElement } from '../../types';

interface OTPConfigEditorProps {
  element: FormElement;
  onUpdate: (element: FormElement) => void;
}

const OTPConfigEditor: React.FC<OTPConfigEditorProps> = memo(({
  element,
  onUpdate
}) => {
  const handleChange = useCallback((field: keyof FormElement, value: any) => {
    onUpdate({ ...element, [field]: value });
  }, [element, onUpdate]);

  const updateOtpConfig = useCallback((key: string, value: any) => {
    handleChange('otpConfig', { ...element.otpConfig, [key]: value });
  }, [element.otpConfig, handleChange]);

  if (element.type !== 'phone_otp' && element.type !== 'email_otp') {
    return null;
  }

  return (
    <div className="space-y-3 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl p-4 border-2 border-emerald-200 shadow-md">
      <div className="flex items-center gap-2 pb-2 border-b-2 border-emerald-200">
        <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">OTP Configuration</h3>
          <p className="text-[10px] text-slate-600 mt-0.5">API endpoints & settings</p>
        </div>
      </div>
      
      {/* API Endpoints */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          API Endpoints
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Send OTP Endpoint *</label>
          <input 
            type="text" 
            value={element.otpConfig?.sendOtpEndpoint || ''} 
            onChange={(e) => updateOtpConfig('sendOtpEndpoint', e.target.value)} 
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" 
            placeholder="https://api.example.com/send-otp"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Verify OTP Endpoint *</label>
          <input 
            type="text" 
            value={element.otpConfig?.verifyOtpEndpoint || ''} 
            onChange={(e) => updateOtpConfig('verifyOtpEndpoint', e.target.value)} 
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" 
            placeholder="https://api.example.com/verify-otp"
          />
        </div>
      </div>

      {/* Field Mapping */}
      <div className="space-y-3 pt-2 border-t border-emerald-200">
        <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Request Field Names
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">{element.type === 'phone_otp' ? 'Phone' : 'Email'} Field</label>
            <input 
              type="text" 
              value={element.otpConfig?.valueFieldName || (element.type === 'phone_otp' ? 'phone' : 'email')} 
              onChange={(e) => updateOtpConfig('valueFieldName', e.target.value)} 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" 
              placeholder={element.type === 'phone_otp' ? 'phone' : 'email'}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">OTP Field</label>
            <input 
              type="text" 
              value={element.otpConfig?.otpFieldName || 'otp'} 
              onChange={(e) => updateOtpConfig('otpFieldName', e.target.value)} 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono text-xs bg-white" 
              placeholder="otp"
            />
          </div>
        </div>
      </div>

      {/* OTP Settings */}
      <div className="space-y-3 pt-2 border-t border-emerald-200">
        <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          OTP Settings
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">OTP Length</label>
            <select 
              value={element.otpConfig?.otpLength || 6} 
              onChange={(e) => updateOtpConfig('otpLength', parseInt(e.target.value))} 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
            >
              <option value={4}>4 digits</option>
              <option value={6}>6 digits</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Expire (sec)</label>
            <input 
              type="number" 
              value={element.otpConfig?.expireSeconds || 300} 
              onChange={(e) => updateOtpConfig('expireSeconds', parseInt(e.target.value) || 300)} 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" 
              min={60}
              max={600}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Resend Delay (sec)</label>
            <input 
              type="number" 
              value={element.otpConfig?.resendDelaySeconds || 60} 
              onChange={(e) => updateOtpConfig('resendDelaySeconds', parseInt(e.target.value) || 60)} 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" 
              min={30}
              max={300}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Max Attempts</label>
            <input 
              type="number" 
              value={element.otpConfig?.maxAttempts || 3} 
              onChange={(e) => updateOtpConfig('maxAttempts', parseInt(e.target.value) || 3)} 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white" 
              min={1}
              max={10}
            />
          </div>
        </div>
      </div>

      {/* Custom Headers (Advanced) */}
      <details className="pt-2 border-t border-emerald-200">
        <summary className="text-xs font-semibold text-emerald-700 cursor-pointer flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Advanced Options
        </summary>
        <div className="mt-3 space-y-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Custom Headers (JSON)</label>
            <textarea 
              value={element.otpConfig?.requestHeaders ? JSON.stringify(element.otpConfig.requestHeaders, null, 2) : ''} 
              onChange={(e) => {
                try {
                  const headers = e.target.value ? JSON.parse(e.target.value) : undefined;
                  updateOtpConfig('requestHeaders', headers);
                } catch { /* ignore parse errors while typing */ }
              }} 
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono bg-white h-20" 
              placeholder='{"Authorization": "Bearer xxx"}'
            />
          </div>
        </div>
      </details>
    </div>
  );
});

OTPConfigEditor.displayName = 'OTPConfigEditor';

export default OTPConfigEditor;
