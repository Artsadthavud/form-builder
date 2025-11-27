import React, { useState } from 'react';
import { FormProject, Signer, SignerMode, FormElement } from '../types';
import SignerManager from './SignerManager';

interface FormSettingsModalProps {
  form: FormProject;
  elements?: FormElement[];
  onSave: (settings: {
    name: string;
    codeName?: string;
    site?: string;
    description?: string;
    tags?: string[];
    signers?: Signer[];
    signerMode?: SignerMode;
  }) => void;
  onClose: () => void;
  isNewForm?: boolean;
}

const FormSettingsModal: React.FC<FormSettingsModalProps> = ({ form, elements = [], onSave, onClose, isNewForm = false }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'signers'>('general');
  const [name, setName] = useState(form.name);
  const [codeName, setCodeName] = useState(form.codeName || '');
  const [site, setSite] = useState(form.site || '');
  const [description, setDescription] = useState(form.description || '');
  const [tags, setTags] = useState<string[]>(form.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [signers, setSigners] = useState<Signer[]>(form.signers || []);
  const [signerMode, setSignerMode] = useState<SignerMode>(form.signerMode || 'single');
  
  const statusInfo = {
    draft: {
      label: 'Draft',
      chip: 'กำลังแก้ไข',
      className: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    published: {
      label: 'Published',
      chip: 'เผยแพร่แล้ว',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    archived: {
      label: 'Archived',
      chip: 'เก็บถาวร',
      className: 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }[form.status];
  const formattedCreated = new Date(form.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const formattedUpdated = new Date(form.updatedAt).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || 'Untitled Form',
      codeName: codeName.trim() || undefined,
      site: site.trim() || undefined,
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      signers: signerMode !== 'single' ? signers : undefined,
      signerMode: signerMode
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="rounded-t-2xl bg-indigo-600 p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/75">{isNewForm ? 'New Form' : 'Form Overview'}</p>
              <h2 className="text-xl font-semibold mt-1">{isNewForm ? 'สร้างฟอร์มใหม่' : 'ตั้งค่าฟอร์ม'}</h2>
              <p className="text-xs text-white/75">{isNewForm ? 'กรอกข้อมูลเบื้องต้นสำหรับฟอร์มของคุณ' : 'แก้ไขชื่อ, รหัส, หมวดหมู่ และรายละเอียดการเผยแพร่'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!isNewForm && (
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs text-center">
              <div className="bg-white/15 rounded-lg py-2 px-3">
                <p className="text-white/70">สถานะ</p>
                <p className="font-semibold">{statusInfo.chip}</p>
              </div>
              <div className="bg-white/15 rounded-lg py-2 px-3">
                <p className="text-white/70">เวอร์ชัน</p>
                <p className="font-semibold">v{form.version}</p>
              </div>
              <div className="bg-white/15 rounded-lg py-2 px-3">
                <p className="text-white/70">ปรับล่าสุด</p>
                <p className="font-semibold text-[10px] leading-4">{formattedUpdated}</p>
              </div>
            </div>
          )}
          
          {/* Tabs */}
          {!isNewForm && (
            <div className="flex gap-1 mt-4 bg-white/10 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'general'
                    ? 'bg-white text-indigo-600'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                📝 ข้อมูลทั่วไป
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signers')}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'signers'
                    ? 'bg-white text-indigo-600'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                ✍️ ผู้เซ็น ({signerMode === 'single' ? 'ปิด' : signers.length})
              </button>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {/* General Tab */}
          {(activeTab === 'general' || isNewForm) && (
          <div className={`grid gap-5 ${isNewForm ? 'lg:grid-cols-[2fr,1fr]' : 'lg:grid-cols-[2fr,1.2fr]'}`}>
            <div className="space-y-4">
              <section className="border border-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">ข้อมูลฟอร์ม</h3>
                  <span className="text-[11px] text-slate-400">จำเป็นต้องกรอก</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Form Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="เช่น แบบสอบถามความพึงพอใจ"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Code Name</label>
                    <input
                      type="text"
                      value={codeName}
                      onChange={(e) => setCodeName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                      placeholder="SURVEY_2024_Q1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Site / Project</label>
                    <input
                      type="text"
                      value={site}
                      onChange={(e) => setSite(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Website A, Mobile App..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Tags</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Sales, internal, Q3..."
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-500"
                      >
                        เพิ่ม
                      </button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {tags.map((tag, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] border border-indigo-100">
                            {tag}
                            <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-indigo-900" aria-label="remove tag">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="อธิบายวัตถุประสงค์หรือรายละเอียดภายใน"
                  />
                </div>
              </section>
            </div>

            {!isNewForm && (
              <div className="space-y-4">
                <section className="border border-slate-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">สถานะฟอร์ม</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] border ${statusInfo.className}`}>
                      {statusInfo.chip}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between"><span>เวอร์ชัน</span><strong>v{form.version}</strong></div>
                    <div className="flex justify-between"><span>สร้างเมื่อ</span><strong>{formattedCreated}</strong></div>
                    <div className="flex justify-between"><span>แก้ไขล่าสุด</span><strong>{formattedUpdated}</strong></div>
                  </div>
                </section>

                <section className="border border-slate-100 rounded-xl p-4 text-sm text-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Form ID</span>
                    <span className="font-mono text-xs break-all text-right">{form.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Share URL</span>
                    <span className="text-indigo-600 text-xs">{form.shareUrl || '-'}</span>
                  </div>
                </section>
              </div>
            )}
            
            {isNewForm && (
              <div className="space-y-4">
                <section className="border border-emerald-100 rounded-xl p-4 space-y-3 bg-emerald-50/30">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-sm font-semibold text-emerald-800">เริ่มต้นใช้งาน</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>กรอกชื่อฟอร์มและข้อมูลเบื้องต้น</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>ระบบจะสร้างฟอร์มและเปิดหน้าแก้ไข</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600">✓</span>
                      <span>คุณสามารถแก้ไขการตั้งค่าได้ทุกเมื่อ</span>
                    </li>
                  </ul>
                </section>
              </div>
            )}
          </div>
          )}

          {/* Signers Tab */}
          {activeTab === 'signers' && !isNewForm && (
            <SignerManager
              signers={signers}
              signerMode={signerMode}
              elements={elements}
              onSignersChange={setSigners}
              onModeChange={setSignerMode}
              currentLanguage="th"
            />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm"
            >
              {isNewForm ? 'สร้างฟอร์มและเริ่มแก้ไข' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormSettingsModal;
