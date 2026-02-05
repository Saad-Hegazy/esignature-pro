import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import SignatureCanvas from 'react-signature-canvas';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface DocumentData {
  id: string;
  title: string;
  fileName: string;
  recipientName?: string;
  status: string;
  expiresAt: string;
  filePath: string;
}

export default function SignDocument() {
  const router = useRouter();
  const { token } = router.query;
  
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const signatureRef = useRef<SignatureCanvas>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (token) {
      fetchDocument();
    }
  }, [token]);

  useEffect(() => {
    if (pdfUrl) {
      renderPDF();
    }
  }, [pdfUrl, currentPage]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${token}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load document');
      }
      
      setDocument(data.document);
      setPdfUrl(data.pdfUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPDF = async () => {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
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
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
    } catch (err) {
      console.error('Error rendering PDF:', err);
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setError('Please provide your signature');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Get signature as data URL
      const signatureDataUrl = signatureRef.current.toDataURL('image/png');
      
      const response = await fetch('/api/documents/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          signature: signatureDataUrl,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit signature');
      }
      
      setSuccess(true);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Successfully Signed!
            </h1>
            <p className="text-gray-600 mb-8">
              Your signature has been submitted and the document has been processed.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>{document?.title}</strong> has been signed successfully.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              You can now close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Unable to Load Document
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'The document you are trying to access is not available.'}
            </p>
            <a 
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign Document</h1>
            <p className="text-gray-600">{document.title}</p>
            {document.recipientName && (
              <p className="text-sm text-gray-500 mt-1">For: {document.recipientName}</p>
            )}
          </div>

          {/* Status Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-900 font-medium">
                  Please review the document and provide your signature below
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Document expires: {new Date(document.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error mb-6">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column: PDF Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Document Preview</h2>
              
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

              <div className="pdf-container overflow-auto max-h-[600px] border border-gray-300 rounded-lg">
                <canvas ref={canvasRef} />
              </div>
            </div>

            {/* Right Column: Signature Pad */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Signature</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draw your signature below *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: 'signature-canvas w-full h-64',
                      }}
                      backgroundColor="white"
                      penColor="black"
                    />
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Sign using your mouse or touchscreen
                    </p>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Consent */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="consent"
                      required
                      className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="consent" className="text-sm text-gray-700">
                      I confirm that I have read and agree to sign this document. I understand that my electronic signature has the same legal effect as a handwritten signature.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner mr-3" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                      Processing Signature...
                    </span>
                  ) : (
                    '✓ Submit Signature'
                  )}
                </button>
              </form>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  What happens next?
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Your signature will be added to the document</li>
                  <li>✓ The signed PDF will be generated automatically</li>
                  <li>✓ The document owner will be notified</li>
                  <li>✓ You'll receive a confirmation message</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
