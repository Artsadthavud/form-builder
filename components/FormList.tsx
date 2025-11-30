import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FormProject, FormStatus } from '../types';

interface FormListProps {
  forms: FormProject[];
  onEdit: (formId: string) => void;
  onCreate: () => void;
  onDelete: (formId: string) => void;
  onDuplicate: (formId: string) => void;
  onStatusChange: (formId: string, status: FormStatus) => void;
  onOpenPublicForm?: (formId: string) => void;
  onOpenSettings?: (formId: string) => void;
}

const FormList: React.FC<FormListProps> = ({ 
  forms, 
  onEdit, 
  onCreate, 
  onDelete, 
  onDuplicate, 
  onStatusChange,
  onOpenPublicForm,
  onOpenSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FormStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const filteredForms = forms
    .filter(form => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        form.name.toLowerCase().includes(searchLower) ||
        (form.codeName && form.codeName.toLowerCase().includes(searchLower)) ||
        (form.site && form.site.toLowerCase().includes(searchLower)) ||
        (form.tags && form.tags.some(tag => tag.toLowerCase().includes(searchLower)));
      const matchesStatus = filterStatus === 'all' || form.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const totalForms = forms.length;
  const publishedCount = forms.filter(f => f.status === 'published').length;
  const draftCount = forms.filter(f => f.status === 'draft').length;
  const archivedCount = forms.filter(f => f.status === 'archived').length;
  const lastUpdatedForm = [...forms].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  const statusFilters: Array<{ key: 'all' | FormStatus; label: string; count: number; color: string }> = [
    { key: 'all', label: 'ทั้งหมด', count: totalForms, color: 'border-slate-200 text-slate-700' },
    { key: 'draft', label: 'แบบร่าง', count: draftCount, color: 'border-slate-200 text-slate-700' },
    { key: 'published', label: 'เผยแพร่', count: publishedCount, color: 'border-slate-200 text-slate-700' },
    { key: 'archived', label: 'เก็บถาวร', count: archivedCount, color: 'border-slate-200 text-slate-700' }
  ];

  const getStatusBadge = (status: FormStatus) => {
    const styles = {
      draft: 'bg-slate-50 text-slate-700 border-slate-200',
      published: 'bg-green-50 text-green-700 border-green-200',
      archived: 'bg-amber-50 text-amber-700 border-amber-200'
    };
    const dots = {
      draft: 'bg-slate-400',
      published: 'bg-green-500',
      archived: 'bg-amber-500'
    };
    const labels = {
      draft: 'แบบร่าง',
      published: 'เผยแพร่แล้ว',
      archived: 'เก็บถาวร'
    };
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border ${styles[status]}`}>
        <span className={`h-2 w-2 rounded-full ${dots[status]}`} />
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sm">
                  <span className="text-xs uppercase tracking-wide">Workspace</span>
                  <span className="font-semibold">FormFlow</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">ศูนย์จัดการฟอร์ม</h1>
                  <p className="text-white/80 mt-1 text-sm">
                    ภาพรวมสถานะฟอร์มทั้งหมด พร้อมเข้าถึงโหมดแก้ไข ตอบกลับ และตั้งค่าที่ต้องการ
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                  <p className="text-xs text-white/70 uppercase">อัปเดตล่าสุด</p>
                  <p className="text-sm font-semibold">
                    {lastUpdatedForm ? lastUpdatedForm.name : 'ยังไม่มีข้อมูล'}
                  </p>
                  {lastUpdatedForm && (
                    <p className="text-xs text-white/70">
                      {formatDate(lastUpdatedForm.updatedAt)}
                    </p>
                  )}
                </div>
                <button
                  onClick={onCreate}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-white text-indigo-600 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  สร้างฟอร์มใหม่
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-900">
              <div className="bg-white/90 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase">ฟอร์มทั้งหมด</p>
                <p className="text-2xl font-semibold">{totalForms}</p>
              </div>
              <div className="bg-white/85 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase">เผยแพร่แล้ว</p>
                <p className="text-2xl font-semibold text-green-600">{publishedCount}</p>
              </div>
              <div className="bg-white/80 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase">แบบร่าง</p>
                <p className="text-2xl font-semibold text-slate-700">{draftCount}</p>
              </div>
              <div className="bg-white/80 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase">เก็บถาวร</p>
                <p className="text-2xl font-semibold text-amber-600">{archivedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ค้นหาฟอร์ม</label>
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="ค้นหาด้วยชื่อ, code name, site หรือแท็ก"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">เรียงลำดับ</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'name')}
                  className="mt-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="updated">แก้ไขล่าสุด</option>
                  <option value="created">สร้างล่าสุด</option>
                  <option value="name">ชื่อ A-Z</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">สถานะ</label>
            <div className="flex flex-wrap gap-2 mt-3">
              {statusFilters.map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    filterStatus === key
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-xs font-semibold ${filterStatus === key ? 'text-white/80' : 'text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">{filteredForms.length} ฟอร์มที่ตรงกับการค้นหา</p>
            <p className="text-xs text-slate-500">อัปเดตเรียงตาม {sortBy === 'name' ? 'ชื่อ' : sortBy === 'created' ? 'วันที่สร้าง' : 'วันที่แก้ไข'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('published')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full border border-white bg-white text-green-600 shadow-sm"
            >
              🔗 ทดสอบฟอร์มที่เผยแพร่
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full border border-slate-200 text-slate-600"
            >
              ✏️ โหมดแก้ไข
            </button>
          </div>
        </div>

        {/* Forms Table */}
        {filteredForms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-2">ยังไม่มีฟอร์ม</h3>
            <p className="text-slate-500 mb-4">เริ่มสร้างฟอร์มแรกของคุณเลย</p>
            <button
              onClick={onCreate}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
            >
              สร้างฟอร์มใหม่
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/70 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ชื่อฟอร์ม
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    คำตอบ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    แก้ไขล่าสุด
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredForms.map((form) => (
                  <tr key={form.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{form.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">v{form.version}</span>
                            {form.codeName && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono">
                                {form.codeName}
                              </span>
                            )}
                            {form.site && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                🌐 {form.site}
                              </span>
                            )}
                          </div>
                          {form.tags && form.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {form.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                              {form.tags.length > 3 && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                                  +{form.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(form.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {form.submissionCount || 0} คำตอบ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(form.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                      <div className="flex items-center justify-end gap-2">
                        {onOpenPublicForm && form.status === 'published' && (
                          <button
                            onClick={() => onOpenPublicForm(form.id)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                            title="ทดสอบตอบฟอร์ม"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                        {onOpenSettings && (
                          <button
                            onClick={() => onOpenSettings(form.id)}
                            className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded transition-colors"
                            title="ตั้งค่าฟอร์ม"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(form.id)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded transition-colors"
                          title="แก้ไขฟอร์ม"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDuplicate(form.id)}
                          className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded transition-colors"
                          title="ทำสำเนา"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <div className="relative">
                          <button 
                            ref={(el) => { buttonRefs.current[form.id] = el; }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({
                                top: rect.bottom + 8,
                                left: rect.right - 192 // 192px = w-48
                              });
                              setOpenMenuId(openMenuId === form.id ? null : form.id);
                            }}
                            className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          {openMenuId === form.id && createPortal(
                            <>
                              <div 
                                className="fixed inset-0 z-[9998]" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div 
                                className="fixed w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-[9999]"
                                style={{
                                  top: `${menuPosition.top}px`,
                                  left: `${menuPosition.left}px`
                                }}
                              >
                                {form.status !== 'published' && (
                                  <button
                                    onClick={() => {
                                      onStatusChange(form.id, 'published');
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-green-700"
                                  >
                                    🟢 เผยแพร่ฟอร์ม
                                  </button>
                                )}
                                {form.status === 'published' && (
                                  <button
                                    onClick={() => {
                                      onStatusChange(form.id, 'draft');
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    📝 ย้ายไปแบบร่าง
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    onStatusChange(form.id, 'archived');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                                >
                                  📦 เก็บถาวร
                                </button>
                                <hr className="my-1 border-slate-200" />
                                <button
                                  onClick={() => {
                                    if (confirm(`ลบฟอร์ม "${form.name}"?`)) {
                                      onDelete(form.id);
                                      setOpenMenuId(null);
                                    }
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  🗑️ ลบฟอร์ม
                                </button>
                              </div>
                            </>,
                            document.body
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormList;
