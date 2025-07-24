import Link from 'next/link';

export default function DashboardCourses({
  enrolledCourses = [],
  isLoading,
  onSelectCourse,
}) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-3 h-40 w-full rounded bg-gray-200" />
            <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-5/6 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!enrolledCourses.length) {
    return (
      <div className="text-center py-12">
        <p className="mb-4 text-lg text-gray-700">
          You are not enrolled in any courses yet.
        </p>
        <Link href="/courses">
          <button className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
            Start Your Learning Journey
          </button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Grid (untouched) */}
      <div className="hidden md:grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {enrolledCourses.map((course) => (
          <div
            key={course.id}
            onClick={() => onSelectCourse?.(course)}
            className="cursor-pointer overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md md:hover:scale-95 duration-200 ease-in-out"
          >
            <div className="relative">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="h-44 w-full object-cover"
              />
              <span className="absolute bottom-2 right-2 rounded bg-green-600/90 px-2 py-0.5 text-xs font-medium text-white">
                Purchased
              </span>
            </div>
            <div className="p-4">
              <h3 className="line-clamp-1 text-lg font-semibold">{course.title}</h3>
              <p className="line-clamp-2 mt-1 text-sm text-gray-800">
                {course.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pro Mobile Card - Full Image */}
     <div className="flex flex-col items-center gap-5 md:hidden mt-4">
  {enrolledCourses.map((course) => (
    <div
      key={course.id}
      onClick={() => onSelectCourse?.(course)}
      className="w-full max-w-[96vw] rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden transition active:scale-95 active:shadow-2xl"
    >
      <div className="relative w-full">
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-56 object-cover rounded-t-2xl"
        />
        <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow z-10">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l4 4 6-6" /></svg>
          Purchased
        </span>
      </div>
      <div className="px-5 py-4">
        <h3 className="text-base font-extrabold text-gray-900 mb-1 line-clamp-1">{course.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
      </div>
    </div>
  ))}
</div>

    </>
  );
}
