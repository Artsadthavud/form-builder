import React, { useState } from 'react';
import { FormRevision, FormProject } from '../types';

interface RevisionHistoryProps {
  form: FormProject;
  revisions: FormRevision[];
  onRestore: (revisionId: string) => void;
  onDelete: (revisionId: string) => void;
  onClose: () => void;
}

const RevisionHistory: React.FC<RevisionHistoryProps> = ({
  form,
  revisions,
  onRestore,
  onDelete,
  onClose
}) => {
  const [selectedRevision, setSelectedRevision] = useState<FormRevision | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const sortedRevisions = [...revisions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getElementsCount = (elements: any[]) => {
    let count = 0;
    const countRecursive = (els: any[]) => {
      els.forEach(el => {
        if (el.type !== 'section') count++;
        if (el.children) countRecursive(el.children);
      });
    };
    countRecursive(elements);
    return count;
  };

  const handleRestore = (revision: FormRevision) => {
    if (confirm(`คุณต้องการคืนค่าไปยังเวอร์ชัน ${revision.version} หรือไม่?\n\nเวอร์ชันปัจจุบันจะถูกบันทึกเป็น revision อัตโนมัติ`)) {
      onRestore(revision.id);
      onClose();
    }
  };

  const handleDelete = (revision: FormRevision) => {
    if (confirm(`คุณต้องการลบ revision v${revision.version} หรือไม่?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      onDelete(revision.id);
      if (selectedRevision?.id === revision.id) {
        setSelectedRevision(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">📜 ประวัติการแก้ไข</h2>
              <p className="text-sm text-slate-500 mt-1">
                ฟอร์ม: {form.name} (เวอร์ชันปัจจุบัน: v{form.version})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Revisions List */}
          <div className="w-1/2 border-r border-slate-200 overflow-y-auto p-6">
            {sortedRevisions.length === 0 ? (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-900 mb-2">ยังไม่มีประวัติการแก้ไข</h3>
                <p className="text-slate-500 text-sm">
                  ระบบจะบันทึก revision อัตโนมัติเมื่อมีการเปลี่ยนแปลงสำคัญ
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Current Version Card */}
                <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-600 text-white">
                          เวอร์ชันปัจจุบัน
                        </span>
                        <span className="text-sm font-bold text-indigo-900">v{form.version}</span>
                      </div>
                      <p className="text-sm text-indigo-700 font-medium mb-2">{form.name}</p>
                      <div className="text-xs text-indigo-600">
                        <div>📝 {getElementsCount(form.elements)} ฟิลด์</div>
                        <div className="mt-1">🕐 {formatDate(form.updatedAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revisions */}
                {sortedRevisions.map((revision) => (
                  <div
                    key={revision.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRevision?.id === revision.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedRevision(revision)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-700">
                            v{revision.version}
                          </span>
                          {revision.description && (
                            <span className="text-xs text-slate-500">
                              {revision.description}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{revision.name}</p>
                        <div className="text-xs text-slate-500">
                          <div>📝 {getElementsCount(revision.elements)} ฟิลด์</div>
                          <div className="mt-1">🕐 {formatDate(revision.createdAt)}</div>
                        </div>
                      </div>
                      {selectedRevision?.id === revision.id && (
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(revision);
                            }}
                            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            title="คืนค่าเวอร์ชันนี้"
                          >
                            ↩️ คืนค่า
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPreview(true);
                            }}
                            className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                            title="ดูรายละเอียด"
                          >
                            👁️ ดู
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(revision);
                            }}
                            className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            title="ลบ revision นี้"
                          >
                            🗑️ ลบ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 overflow-y-auto p-6 bg-slate-50">
            {selectedRevision ? (
              showPreview ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      รายละเอียด v{selectedRevision.version}
                    </h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      ← กลับ
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Metadata */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-2">ข้อมูลฟอร์ม</h4>
                      <div className="text-sm space-y-1 text-slate-600">
                        <div><strong>ชื่อ:</strong> {selectedRevision.name}</div>
                        <div>
                          <strong>Title:</strong>{' '}
                          {typeof selectedRevision.metadata.title === 'string'
                            ? selectedRevision.metadata.title
                            : selectedRevision.metadata.title?.th || '-'}
                        </div>
                        <div>
                          <strong>Description:</strong>{' '}
                          {typeof selectedRevision.metadata.description === 'string'
                            ? selectedRevision.metadata.description
                            : selectedRevision.metadata.description?.th || '-'}
                        </div>
                      </div>
                    </div>

                    {/* Elements */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-3">ฟิลด์ทั้งหมด ({getElementsCount(selectedRevision.elements)} ฟิลด์)</h4>
                      <div className="space-y-2">
                        {selectedRevision.elements.map((el: any) => (
                          <div
                            key={el.id}
                            className="text-sm p-2 bg-slate-50 rounded border border-slate-200"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                {el.type}
                              </span>
                              <span className="text-slate-700">
                                {typeof el.label === 'string' ? el.label : el.label?.th || el.label?.en || 'Untitled'}
                              </span>
                              {el.required && (
                                <span className="text-red-500 text-xs">*</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pages */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h4 className="font-medium text-slate-900 mb-2">หน้า ({selectedRevision.pages.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRevision.pages.map((page: any) => (
                          <div
                            key={page.id}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-sm"
                          >
                            {page.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">เลือก revision เพื่อดูข้อมูล</h3>
                  <p className="text-slate-500 text-sm">
                    คลิกที่ revision ด้านซ้ายเพื่อดูรายละเอียด
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-900 mb-2">เลือก Revision</h3>
                <p className="text-slate-500 text-sm">
                  คลิกที่ revision ด้านซ้ายเพื่อดูรายละเอียดและจัดการ
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>
              💡 <strong>เคล็ดลับ:</strong> Revision จะถูกบันทึกอัตโนมัติเมื่อมีการเปลี่ยนแปลงสำคัญ
            </div>
            <div>
              ทั้งหมด {sortedRevisions.length} revisions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevisionHistory;
