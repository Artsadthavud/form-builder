import React, { useState } from 'react';
import { Signer, SignerMode, SignerAssignmentType, TranslatableText, FormElement, SignerOption } from '../types';
import { getText } from '../utils/i18n';

interface SignerManagerProps {
  signers: Signer[];
  signerMode: SignerMode;
  elements: FormElement[];
  onSignersChange: (signers: Signer[]) => void;
  onModeChange: (mode: SignerMode) => void;
  currentLanguage: 'th' | 'en';
}

const SignerManager: React.FC<SignerManagerProps> = ({
  signers,
  signerMode,
  elements,
  onSignersChange,
  onModeChange,
  currentLanguage
}) => {
  const [expandedSigner, setExpandedSigner] = useState<string | null>(null);

  // Get all sections for accessible sections dropdown
  const sections = elements.filter(el => el.type === 'section');
  
  // Get all signature elements for linking
  const signatureElements = elements.filter(el => el.type === 'signature');
  
  // Get all email fields for assignment
  const emailFields = elements.filter(el => el.type === 'email' || el.type === 'email_otp');

  const generateId = () => `signer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addSigner = () => {
    const newSigner: Signer = {
      id: generateId(),
      name: `ผู้เซ็น ${signers.length + 1}`,
      label: { th: `ผู้เซ็น ${signers.length + 1}`, en: `Signer ${signers.length + 1}` },
      order: signers.length + 1,
      required: true,
      assignmentType: 'self',
      notifyOnReady: true,
      signaturePosition: 'inline'
    };
    onSignersChange([...signers, newSigner]);
    setExpandedSigner(newSigner.id);
  };

  const updateSigner = (id: string, updates: Partial<Signer>) => {
    onSignersChange(signers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSigner = (id: string) => {
    onSignersChange(signers.filter(s => s.id !== id));
  };

  const moveSigner = (id: string, direction: 'up' | 'down') => {
    const index = signers.findIndex(s => s.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= signers.length) return;
    
    const newSigners = [...signers];
    [newSigners[index], newSigners[newIndex]] = [newSigners[newIndex], newSigners[index]];
    
    // Update order numbers
    newSigners.forEach((s, i) => s.order = i + 1);
    onSignersChange(newSigners);
  };

  const modeOptions: { value: SignerMode; label: string; description: string }[] = [
    { value: 'single', label: 'ไม่ใช้ Multi-Signer', description: 'ฟอร์มปกติ ไม่มีการแบ่งส่วนหรือลำดับการเซ็น' },
    { value: 'sequential', label: 'เซ็นตามลำดับ', description: 'ผู้เซ็นแต่ละคนต้องเซ็นตามลำดับที่กำหนด' },
    { value: 'parallel', label: 'เซ็นพร้อมกัน', description: 'ผู้เซ็นทุกคนสามารถเซ็นได้พร้อมกัน' },
    { value: 'approval', label: 'อนุมัติตามลำดับขั้น', description: 'รูปแบบ approval chain สำหรับเอกสารที่ต้องอนุมัติ' }
  ];

  const assignmentOptions: { value: SignerAssignmentType; label: string; icon: string; description?: string }[] = [
    { value: 'self', label: 'คนกรอกเซ็นเอง', icon: '👤', description: 'ผู้กรอกฟอร์มเซ็นเอง' },
    { value: 'predefined', label: 'กำหนด Email ล่วงหน้า', icon: '📧', description: 'ระบุ email ผู้เซ็นตอนออกแบบฟอร์ม' },
    { value: 'form_field', label: 'ดึงจากฟิลด์ในฟอร์ม', icon: '📝', description: 'ใช้ email จากฟิลด์ที่กรอกในฟอร์ม' },
    { value: 'manual', label: 'ผู้ส่งระบุเอง', icon: '✍️', description: 'ผู้ส่งกรอก email ผู้เซ็นตอน submit' },
    { value: 'on_submit', label: 'เลือกตอนกด Submit', icon: '🖱️', description: 'แสดง popup ให้เลือกผู้เซ็นตอน submit' }
  ];

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <section className="border border-slate-100 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✍️</span>
          <h3 className="text-sm font-semibold text-slate-700">รูปแบบการเซ็น</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {modeOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                signerMode === option.value
                  ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <p className={`text-xs font-medium ${signerMode === option.value ? 'text-indigo-700' : 'text-slate-700'}`}>
                {option.label}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Signers List */}
      {signerMode !== 'single' && (
        <section className="border border-slate-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <h3 className="text-sm font-semibold text-slate-700">ผู้เซ็น ({signers.length} คน)</h3>
            </div>
            <button
              type="button"
              onClick={addSigner}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              + เพิ่มผู้เซ็น
            </button>
          </div>

          {signers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">✍️</p>
              <p className="text-sm">ยังไม่มีผู้เซ็น</p>
              <p className="text-xs text-slate-400">คลิก "เพิ่มผู้เซ็น" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="space-y-2">
              {signers.map((signer, index) => (
                <div
                  key={signer.id}
                  className={`border rounded-lg transition-all ${
                    expandedSigner === signer.id
                      ? 'border-indigo-300 bg-indigo-50/50'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Signer Header */}
                  <div
                    className="flex items-center gap-2 p-3 cursor-pointer"
                    onClick={() => setExpandedSigner(expandedSigner === signer.id ? null : signer.id)}
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                      {signer.order}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{signer.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {assignmentOptions.find(a => a.value === signer.assignmentType)?.label}
                        {signer.required && ' • จำเป็น'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {signerMode === 'sequential' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveSigner(signer.id, 'up'); }}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveSigner(signer.id, 'down'); }}
                            disabled={index === signers.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          >
                            ▼
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeSigner(signer.id); }}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        🗑️
                      </button>
                      <span className={`transition-transform ${expandedSigner === signer.id ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Signer Details */}
                  {expandedSigner === signer.id && (
                    <div className="border-t border-slate-200 p-3 space-y-3 bg-white rounded-b-lg">
                      {/* Name & Label */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">ชื่อ Role</label>
                          <input
                            type="text"
                            value={signer.name}
                            onChange={(e) => updateSigner(signer.id, { name: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                            placeholder="เช่น ผู้ขอ, ผู้อนุมัติ"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">Label แสดงในฟอร์ม (TH)</label>
                          <input
                            type="text"
                            value={typeof signer.label === 'object' ? signer.label.th : signer.label}
                            onChange={(e) => updateSigner(signer.id, { 
                              label: { 
                                th: e.target.value, 
                                en: typeof signer.label === 'object' ? signer.label.en : e.target.value 
                              } 
                            })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                          />
                        </div>
                      </div>

                      {/* Assignment Type */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">วิธีกำหนดผู้เซ็น</label>
                        <div className="grid grid-cols-2 gap-2">
                          {assignmentOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => updateSigner(signer.id, { assignmentType: option.value })}
                              className={`p-2 rounded border text-left text-xs transition-all ${
                                signer.assignmentType === option.value
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                              title={option.description}
                            >
                              <div className="flex items-center gap-1">
                                <span>{option.icon}</span>
                                <span className="font-medium">{option.label}</span>
                              </div>
                              {option.description && (
                                <p className="text-[10px] text-slate-500 mt-0.5 ml-5">{option.description}</p>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Conditional Fields based on Assignment Type */}
                      {signer.assignmentType === 'predefined' && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">Email ผู้เซ็น</label>
                          <input
                            type="email"
                            value={signer.assignedEmail || ''}
                            onChange={(e) => updateSigner(signer.id, { assignedEmail: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                            placeholder="signer@company.com"
                          />
                        </div>
                      )}

                      {signer.assignmentType === 'form_field' && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">ฟิลด์ Email ในฟอร์ม</label>
                          <select
                            value={signer.assignedField || ''}
                            onChange={(e) => updateSigner(signer.id, { assignedField: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                          >
                            <option value="">-- เลือกฟิลด์ --</option>
                            {emailFields.map(field => (
                              <option key={field.id} value={field.id}>
                                {getText(field.label, currentLanguage)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {signer.assignmentType === 'on_submit' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-600">รายชื่อผู้เซ็นให้เลือก</label>
                            <button
                              type="button"
                              onClick={() => {
                                const newOption: SignerOption = {
                                  id: `opt_${Date.now()}`,
                                  name: '',
                                  email: ''
                                };
                                updateSigner(signer.id, {
                                  signerOptions: [...(signer.signerOptions || []), newOption]
                                });
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-700"
                            >
                              + เพิ่มตัวเลือก
                            </button>
                          </div>
                          {(signer.signerOptions || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic">ยังไม่มีรายชื่อ คลิก "เพิ่มตัวเลือก"</p>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {(signer.signerOptions || []).map((opt, idx) => (
                                <div key={opt.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                                  <span className="text-xs text-slate-400 pt-1.5">{idx + 1}.</span>
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={opt.name}
                                      onChange={(e) => {
                                        const updated = (signer.signerOptions || []).map(o =>
                                          o.id === opt.id ? { ...o, name: e.target.value } : o
                                        );
                                        updateSigner(signer.id, { signerOptions: updated });
                                      }}
                                      placeholder="ชื่อ"
                                      className="px-2 py-1 border border-slate-200 rounded text-xs"
                                    />
                                    <input
                                      type="email"
                                      value={opt.email}
                                      onChange={(e) => {
                                        const updated = (signer.signerOptions || []).map(o =>
                                          o.id === opt.id ? { ...o, email: e.target.value } : o
                                        );
                                        updateSigner(signer.id, { signerOptions: updated });
                                      }}
                                      placeholder="email@example.com"
                                      className="px-2 py-1 border border-slate-200 rounded text-xs"
                                    />
                                    <input
                                      type="text"
                                      value={opt.department || ''}
                                      onChange={(e) => {
                                        const updated = (signer.signerOptions || []).map(o =>
                                          o.id === opt.id ? { ...o, department: e.target.value } : o
                                        );
                                        updateSigner(signer.id, { signerOptions: updated });
                                      }}
                                      placeholder="แผนก (optional)"
                                      className="px-2 py-1 border border-slate-200 rounded text-xs"
                                    />
                                    <input
                                      type="text"
                                      value={opt.position || ''}
                                      onChange={(e) => {
                                        const updated = (signer.signerOptions || []).map(o =>
                                          o.id === opt.id ? { ...o, position: e.target.value } : o
                                        );
                                        updateSigner(signer.id, { signerOptions: updated });
                                      }}
                                      placeholder="ตำแหน่ง (optional)"
                                      className="px-2 py-1 border border-slate-200 rounded text-xs"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = (signer.signerOptions || []).filter(o => o.id !== opt.id);
                                      updateSigner(signer.id, { signerOptions: updated });
                                    }}
                                    className="text-red-400 hover:text-red-600 p-1"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-slate-500">
                            ผู้ submit จะเห็น dropdown เลือกผู้เซ็นจากรายการนี้
                          </p>
                        </div>
                      )}

                      {/* Signature Element */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">ช่องลายเซ็น</label>
                          <select
                            value={signer.signatureElementId || ''}
                            onChange={(e) => updateSigner(signer.id, { signatureElementId: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                          >
                            <option value="">-- เลือกช่องลายเซ็น --</option>
                            {signatureElements.map(el => (
                              <option key={el.id} value={el.id}>
                                {getText(el.label, currentLanguage)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">ตำแหน่งลายเซ็น</label>
                          <select
                            value={signer.signaturePosition || 'inline'}
                            onChange={(e) => updateSigner(signer.id, { signaturePosition: e.target.value as 'inline' | 'end' })}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm"
                          >
                            <option value="inline">ในส่วนของตัวเอง</option>
                            <option value="end">ท้ายฟอร์ม</option>
                          </select>
                        </div>
                      </div>

                      {/* Accessible Sections */}
                      {sections.length > 0 && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">ส่วนที่เข้าถึงได้</label>
                          <div className="flex flex-wrap gap-2">
                            {sections.map(section => {
                              const isSelected = signer.accessibleSections?.includes(section.id);
                              return (
                                <button
                                  key={section.id}
                                  type="button"
                                  onClick={() => {
                                    const current = signer.accessibleSections || [];
                                    const updated = isSelected
                                      ? current.filter(id => id !== section.id)
                                      : [...current, section.id];
                                    updateSigner(signer.id, { accessibleSections: updated });
                                  }}
                                  className={`px-2 py-1 rounded text-xs transition-all ${
                                    isSelected
                                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {getText(section.label, currentLanguage)}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-slate-400">ไม่เลือก = เข้าถึงได้ทุกส่วน</p>
                        </div>
                      )}

                      {/* Options */}
                      <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={signer.required}
                            onChange={(e) => updateSigner(signer.id, { required: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          จำเป็นต้องเซ็น
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={signer.notifyOnReady || false}
                            onChange={(e) => updateSigner(signer.id, { notifyOnReady: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          แจ้งเตือนเมื่อถึงคิว
                        </label>
                        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={signer.canEditOtherSections || false}
                            onChange={(e) => updateSigner(signer.id, { canEditOtherSections: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600"
                          />
                          แก้ไขส่วนอื่นได้
                        </label>
                      </div>

                      {/* Reminder Days */}
                      {signer.notifyOnReady && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">เตือนซ้ำทุก (วัน)</label>
                          <input
                            type="number"
                            value={signer.reminderDays || ''}
                            onChange={(e) => updateSigner(signer.id, { reminderDays: parseInt(e.target.value) || undefined })}
                            className="w-24 px-2 py-1.5 border border-slate-200 rounded text-sm"
                            placeholder="0"
                            min={0}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Preset Templates */}
          {signers.length === 0 && (
            <div className="border-t border-slate-100 pt-3 mt-3">
              <p className="text-xs text-slate-500 mb-2">หรือใช้ Template:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSignersChange([
                      {
                        id: generateId(),
                        name: 'ผู้ขอ',
                        label: { th: 'ผู้ขอ', en: 'Requester' },
                        order: 1,
                        required: true,
                        assignmentType: 'self',
                        signaturePosition: 'inline'
                      },
                      {
                        id: generateId(),
                        name: 'ผู้อนุมัติ',
                        label: { th: 'ผู้อนุมัติ', en: 'Approver' },
                        order: 2,
                        required: true,
                        assignmentType: 'manual',
                        notifyOnReady: true,
                        signaturePosition: 'end'
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100"
                >
                  📋 ผู้ขอ + ผู้อนุมัติ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSignersChange([
                      {
                        id: generateId(),
                        name: 'ผู้ทำสัญญาฝ่าย ก',
                        label: { th: 'ผู้ทำสัญญาฝ่าย ก', en: 'Party A' },
                        order: 1,
                        required: true,
                        assignmentType: 'self',
                        signaturePosition: 'end'
                      },
                      {
                        id: generateId(),
                        name: 'ผู้ทำสัญญาฝ่าย ข',
                        label: { th: 'ผู้ทำสัญญาฝ่าย ข', en: 'Party B' },
                        order: 2,
                        required: true,
                        assignmentType: 'predefined',
                        notifyOnReady: true,
                        signaturePosition: 'end'
                      },
                      {
                        id: generateId(),
                        name: 'พยาน',
                        label: { th: 'พยาน', en: 'Witness' },
                        order: 3,
                        required: false,
                        assignmentType: 'manual',
                        signaturePosition: 'end'
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  📝 สัญญา (2 ฝ่าย + พยาน)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSignersChange([
                      {
                        id: generateId(),
                        name: 'ผู้จัดทำ',
                        label: { th: 'ผู้จัดทำ', en: 'Creator' },
                        order: 1,
                        required: true,
                        assignmentType: 'self',
                        signaturePosition: 'end'
                      },
                      {
                        id: generateId(),
                        name: 'หัวหน้างาน',
                        label: { th: 'หัวหน้างาน', en: 'Supervisor' },
                        order: 2,
                        required: true,
                        assignmentType: 'manual',
                        notifyOnReady: true,
                        signaturePosition: 'end'
                      },
                      {
                        id: generateId(),
                        name: 'ผู้จัดการ',
                        label: { th: 'ผู้จัดการ', en: 'Manager' },
                        order: 3,
                        required: true,
                        assignmentType: 'manual',
                        notifyOnReady: true,
                        signaturePosition: 'end'
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100"
                >
                  🏢 3 ระดับอนุมัติ
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Summary */}
      {signerMode !== 'single' && signers.length > 0 && (
        <section className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/50">
          <h4 className="text-xs font-semibold text-emerald-800 mb-2">📊 สรุปการตั้งค่า</h4>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• รูปแบบ: <strong>{modeOptions.find(m => m.value === signerMode)?.label}</strong></li>
            <li>• ผู้เซ็นทั้งหมด: <strong>{signers.length} คน</strong></li>
            <li>• ต้องเซ็น: <strong>{signers.filter(s => s.required).length} คน</strong></li>
            {signers.some(s => s.signaturePosition === 'end') && (
              <li>• ลายเซ็นท้ายฟอร์ม: <strong>{signers.filter(s => s.signaturePosition === 'end').length} คน</strong></li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
};

export default SignerManager;
