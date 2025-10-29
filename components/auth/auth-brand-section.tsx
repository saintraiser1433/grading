export function AuthBrandSection() {
  const backgroundPattern =
    "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-slate-600/20" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("${backgroundPattern}")` }} />

      <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mr-4">
              <img 
                src="/gitlogo.png" 
                alt="GIT Logo" 
                className="w-12 h-12 rounded-lg"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'block';
                }}
              />
              <span className="text-slate-900 font-bold text-xl hidden">G</span>
            </div>
            <h1 className="text-2xl font-bold">GIT Grading System</h1>
          </div>
          <h2 className="text-2xl font-bold mb-6 leading-tight">Advanced Academic Management Platform</h2>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Streamline academic processes, manage grades efficiently, and enhance student learning outcomes with our
            comprehensive grading and academic management system.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Real-time Grade Management</h3>
              <p className="text-slate-300">Track and manage student grades with instant updates and comprehensive reporting.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Student Progress Analytics</h3>
              <p className="text-slate-300">Monitor student performance with detailed analytics and progress insights.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Role-based Access Control</h3>
              <p className="text-slate-300">Secure access for students, teachers, and administrators with appropriate permissions.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-slate-500/10 rounded-full blur-xl" />
    </div>
  )
}
