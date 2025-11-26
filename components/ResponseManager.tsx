import React, { useState } from 'react';
import { FormResponse, FormProject, Language } from '../types';
import { getText } from '../utils/i18n';

interface ResponseManagerProps {
  form: FormProject;
  responses: FormResponse[];
  onBack: () => void;
  onExportCSV: () => void;
}

const ResponseManager: React.FC<ResponseManagerProps> = ({ 
  form, 
  responses, 
  onBack,
  onExportCSV 
}) => {
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResponses = responses.filter(response => {
    const searchStr = JSON.stringify(response.data).toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

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

  const formatTime = (seconds?: number) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getFieldLabel = (fieldId: string, lang: Language = 'th') => {
    const element = form.elements.find(el => el.id === fieldId);
    if (!element) return fieldId;
    return getText(element.label, lang);
  };

  const renderValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'string' && value.startsWith('data:image')) {
      return <img src={value} alt="Signature" className="max-w-xs rounded border border-slate-200" />;
    }
    return String(value);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">📊 คำตอบฟอร์ม</h1>
                <p className="text-sm text-slate-500 mt-1">{form.name}</p>
              </div>
            </div>
            <button
              onClick={onExportCSV}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-sm hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-500">คำตอบทั้งหมด</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{responses.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-500">เวลาเฉลี่ยที่ใช้</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {formatTime(Math.round(responses.reduce((sum, r) => sum + (r.completionTime || 0), 0) / (responses.length || 1)))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-500">คำตอบล่าสุด</div>
            <div className="text-sm font-medium text-slate-900 mt-1">
              {responses.length > 0 ? formatDate(responses[0].submittedAt) : '-'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-500">อัตราการตอบ</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {responses.length > 0 ? '100%' : '0%'}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาคำตอบ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Responses List/Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900">คำตอบทั้งหมด ({filteredResponses.length})</h3>
              </div>
              <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                {filteredResponses.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm text-slate-500">ยังไม่มีคำตอบ</p>
                  </div>
                ) : (
                  filteredResponses.map((response) => (
                    <button
                      key={response.id}
                      onClick={() => setSelectedResponse(response)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                        selectedResponse?.id === response.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-500">#{response.id.slice(0, 8)}</span>
                        {response.language && (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {response.language === 'th' ? '🇹🇭' : '🇬🇧'}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-900 mb-1">
                        {formatDate(response.submittedAt)}
                      </div>
                      <div className="text-xs text-slate-500">
                        เวลา: {formatTime(response.completionTime)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {selectedResponse ? (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">รายละเอียดคำตอบ</h3>
                    <span className="text-xs font-mono text-slate-500">#{selectedResponse.id}</span>
                  </div>
                </div>
                <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <div className="text-xs text-slate-500">วันที่ส่ง</div>
                      <div className="text-sm font-medium text-slate-900">{formatDate(selectedResponse.submittedAt)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">เวลาที่ใช้</div>
                      <div className="text-sm font-medium text-slate-900">{formatTime(selectedResponse.completionTime)}</div>
                    </div>
                    {selectedResponse.ipAddress && (
                      <div>
                        <div className="text-xs text-slate-500">IP Address</div>
                        <div className="text-sm font-medium text-slate-900 font-mono">{selectedResponse.ipAddress}</div>
                      </div>
                    )}
                    {selectedResponse.language && (
                      <div>
                        <div className="text-xs text-slate-500">ภาษา</div>
                        <div className="text-sm font-medium text-slate-900">
                          {selectedResponse.language === 'th' ? 'ภาษาไทย' : 'English'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Form Data */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">คำตอบ</h4>
                    {Object.entries(selectedResponse.data).map(([fieldId, value]) => (
                      <div key={fieldId} className="border-b border-slate-100 pb-4">
                        <div className="text-sm font-medium text-slate-700 mb-2">
                          {getFieldLabel(fieldId, selectedResponse.language)}
                        </div>
                        <div className="text-sm text-slate-900">
                          {renderValue(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-slate-900 mb-2">เลือกคำตอบเพื่อดูรายละเอียด</h3>
                <p className="text-slate-500">คลิกที่คำตอบทางด้านซ้ายเพื่อดูข้อมูลเพิ่มเติม</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseManager;
