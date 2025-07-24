'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { LoaderCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const orderId = searchParams.get('orderId');
  const courseId = searchParams.get('courseId');

  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/dashboard');
    }, 4000);
    return () => clearTimeout(timeout);
  }, [router]);

  useEffect(() => {
    if (!courseId) {
      setLoadingCourse(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses/${courseId}`, {
          credentials: 'include',
        });
        const data = await res.json();
        setCourse(data);
      } catch (e) {
        console.error('Failed to load course for invoice', e);
      } finally {
        setLoadingCourse(false);
      }
    })();
  }, [courseId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow text-center max-w-lg w-full">
        <h1 className="text-3xl font-bold text-green-700 mb-4">Payment Successful 🎉</h1>

        <div className="bg-gray-100 p-4 rounded mb-6 text-left">
          <h2 className="text-xl font-semibold mb-2">Invoice Details</h2>
          {loadingCourse ? (
            <div className="flex items-center">
              <LoaderCircle className="animate-spin mr-2" />
              <span className="text-gray-600">Loading invoice…</span>
            </div>
          ) : course ? (
            <>
              <p><strong>Course:</strong> {course.title}</p>
              <p><strong>Order ID:</strong> {orderId}</p>
              <p><strong>Payment ID:</strong> {paymentId}</p>
              <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
            </>
          ) : (
            <p className="text-red-500">Unable to load course info.</p>
          )}
        </div>

        <p className="text-gray-700 mb-6">You have been enrolled in the course.</p>
        <p className="text-gray-500 mb-2">Redirecting to your dashboard...</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-900 transition"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading payment status...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
