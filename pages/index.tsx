import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              E-Signature Pro
            </h1>
            <p className="text-xl text-gray-600">
              Professional document signing with visual coordinate selection
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Admin Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Portal</h2>
              <p className="text-gray-600 mb-6">
                Upload PDFs and visually select signature field coordinates. Generate secure signing links for recipients.
              </p>
              <Link 
                href="/admin/upload"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Go to Admin Panel
              </Link>
            </div>

            {/* Guest Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign Document</h2>
              <p className="text-gray-600 mb-6">
                Have a signing link? Open your document, draw your signature using the signature pad, and submit.
              </p>
              <button
                onClick={() => {
                  const token = prompt('Enter your document token:');
                  if (token) {
                    router.push(`/sign/${token}`);
                  }
                }}
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Enter Token to Sign
              </button>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Visual Coordinate Selection</h4>
                  <p className="text-gray-600 text-sm">Click and drag to select signature field position on PDF</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Signature Pad</h4>
                  <p className="text-gray-600 text-sm">Draw signatures using HTML5 canvas with smooth rendering</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">PDF Merging</h4>
                  <p className="text-gray-600 text-sm">Signature automatically overlaid at exact coordinates</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Secure Links</h4>
                  <p className="text-gray-600 text-sm">Unique tokens with expiration dates for security</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">Built with modern technologies</p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700 shadow">Next.js</span>
              <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700 shadow">TypeScript</span>
              <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700 shadow">Tailwind CSS</span>
              <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700 shadow">PDF-lib</span>
              <span className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-gray-700 shadow">Prisma</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
