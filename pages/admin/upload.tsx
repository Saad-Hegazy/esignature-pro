import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface SignatureField {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function AdminUpload() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureField, setSignatureField] = useState<SignatureField | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF preview
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfPreviewUrl(url);
      renderPDF(url);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [file, currentPage]);

  const renderPDF = async (url: string) => {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      setTotalPages(pdf.numPages);
      
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      setPdfDimensions({
        width: viewport.width,
        height: viewport.height,
      });
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
    } catch (err) {
      console.error('Error rendering PDF:', err);
      setError('Failed to render PDF preview');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setSignatureField(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPoint({ x, y });
    setSignatureField({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);
    const x = Math.min(currentX, startPoint.x);
    const y = Math.min(currentY, startPoint.y);
    
    setSignatureField({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a PDF file');
      return;
    }
    
    if (!signatureField || signatureField.width < 50 || signatureField.height < 30) {
      setError('Please draw a signature field on the PDF (minimum 50x30 pixels)');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a document title');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('recipientName', recipientName);
      formData.append('recipientEmail', recipientEmail);
      formData.append('signatureX', signatureField.x.toString());
      formData.append('signatureY', signatureField.y.toString());
      formData.append('signatureWidth', signatureField.width.toString());
      formData.append('signatureHeight', signatureField.height.toString());
      formData.append('pageNumber', currentPage.toString());
      if (pdfDimensions) {
        formData.append('pdfWidth', pdfDimensions.width.toString());
        formData.append('pdfHeight', pdfDimensions.height.toString());
      }
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setSuccess(`Document uploaded successfully! Token: ${data.token}`);
      
      // Reset form
      setTimeout(() => {
        router.push(`/admin/documents`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const clearSignatureField = () => {
    setSignatureField(null);
    setStartPoint(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
              <p className="text-gray-600 mt-2">Upload PDF and select signature field location</p>
            </div>
            <Link 
              href="/admin/documents"
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              View Documents
            </Link>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="alert alert-error mb-6">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success mb-6">
              {success}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column: Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6">Document Details</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Employment Contract"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload PDF *
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Maximum file size: 50MB</p>
                </div>

                {signatureField && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Signature Field Selected</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>Position: ({Math.round(signatureField.x)}, {Math.round(signatureField.y)})</p>
                      <p>Size: {Math.round(signatureField.width)} × {Math.round(signatureField.height)} px</p>
                      <p>Page: {currentPage} of {totalPages}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSignatureField}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear and redraw
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !file || !signatureField}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>

            {/* Right Column: PDF Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">PDF Preview</h2>
              
              {!file ? (
                <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Upload a PDF to preview</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 font-medium mb-2">
                      📍 Draw signature field on the PDF
                    </p>
                    <p className="text-sm text-blue-800">
                      Click and drag on the PDF to define where the signature should appear
                    </p>
                  </div>

                  {totalPages > 1 && (
                    <div className="mb-4 flex items-center justify-center gap-4">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}

                  <div 
                    ref={containerRef}
                    className="relative pdf-container overflow-auto max-h-[600px] border border-gray-300 rounded-lg"
                  >
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className="cursor-crosshair"
                    />
                    
                    {signatureField && signatureField.width > 0 && signatureField.height > 0 && (
                      <div
                        className="signature-field"
                        style={{
                          left: `${signatureField.x}px`,
                          top: `${signatureField.y}px`,
                          width: `${signatureField.width}px`,
                          height: `${signatureField.height}px`,
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
