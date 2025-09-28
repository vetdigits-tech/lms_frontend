// app/dashboard/quizzes/results/[attemptid]/page.jsx
'use client';

import { useParams } from 'next/navigation';

export default function QuizResultsPendingPage() {
  // No TypeScript generics in .jsx
  const params = useParams();
  const attemptId = params?.attemptid;

  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold">Quiz results pending</h1>

      <p className="mt-2 text-gray-600">
        {attemptId
          ? `Results for attempt #${attemptId} will be available as the quiz ends.`
          : 'Results will be available as the quiz ends.'}
      </p>

      <div className="mt-6 rounded-lg border p-4 bg-gray-50">
        <p className="text-sm text-gray-700">
          Check back after the quiz is completed to view the results.
        </p>
      </div>
    </main>
  );
}
