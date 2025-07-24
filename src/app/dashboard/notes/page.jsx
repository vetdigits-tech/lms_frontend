'use client';

export default function ComingSoon() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#f6f7fa] px-4">
      <main className="
        flex flex-col items-center
        px-6 py-12 md:px-16 md:py-16
        bg-white/90 backdrop-blur-xl
        rounded-2xl shadow-xl
        max-w-2xl w-full
        border border-gray-200
      ">
        <h1 className="flex items-center text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 text-center drop-shadow">
          <span className="mr-3 text-3xl md:text-4xl">🚧</span>
          <span>Coming Soon</span>
        </h1>
        <p className="text-lg text-gray-700 mb-4 text-center font-medium">
          This feature is under construction.<br />
          Check back soon for something awesome!
        </p>
        <div className="flex justify-center mt-4">
          <span className="inline-block px-6 py-3 rounded-2xl bg-indigo-100 text-indigo-700 font-semibold shadow text-base">
            LMS Update in Progress
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-8 opacity-80">
          &copy; {new Date().getFullYear()} VETDIGIT LMS
        </div>
      </main>
    </div>
  );
}
