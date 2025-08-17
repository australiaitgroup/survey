import React, { useState } from 'react';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => void;
  loading?: boolean;
}

const ImportCSVModal: React.FC<ImportCSVModalProps> = ({
  isOpen,
  onClose,
  onImport,
  loading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
      setSelectedFile(null);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `text,description,type,options,correctAnswer,points,difficulty,tags,explanation
"What is 2+2?","Basic math question","single_choice","3|4|5|6","1","1","easy","math,basic","The correct answer is 4"
"Select all prime numbers","","multiple_choice","2|3|4|5|6","0,1,3","2","medium","math,prime","2, 3, and 5 are prime numbers"
"What is the capital of France?","","short_text","","Paris","1","easy","geography","Paris is the capital of France"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_bank_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Import Questions from CSV</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">CSV Format Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• First row must contain column headers</li>
              <li>• Required columns: text, type (single_choice/multiple_choice/short_text)</li>
              <li>• Options: separate with pipe (|) character</li>
              <li>• Correct answer: use option index (0-based) or text for short_text</li>
              <li>• Multiple correct answers: separate indices with commas</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Download CSV Template
            </button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="csv-file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Selected file:</p>
                <p className="text-sm text-gray-600">{selectedFile.name}</p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-700"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <label
                  htmlFor="csv-file"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                >
                  Choose a file
                </label>
                <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                <p className="text-xs text-gray-400 mt-2">CSV files only</p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Questions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCSVModal;