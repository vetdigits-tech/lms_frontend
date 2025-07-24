'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Script from 'next/script';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CheckoutPage({ params }) {
  const courseId = params.id;
  const { user, loading: userLoading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isGranting, setIsGranting] = useState(false); // ← new

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp('(^|; )' + name + '=([^;]+)')
    );
    return match ? decodeURIComponent(match[2]) : null;
  }

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/courses/${courseId}`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        const data = await res.json();
        setCourse(data);
      } catch (err) {
        console.error('Failed to load course', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL, courseId]);

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderCircle className="animate-spin mr-2" />
        <span className="text-gray-600">Loading checkout…</span>
      </div>
    );
  }

  if (!course || course.message) {
    return (
      <p className="py-6 text-center text-red-500">Course not found.</p>
    );
  }

  const handlePayment = async () => {
    try {
      // 1) CSRF & create Razorpay session
      await fetch(`${API_URL}/sanctum/csrf-cookie`, {
        credentials: 'include',
      });
      const xsrfToken = getCookie('XSRF-TOKEN');

      const sessionRes = await fetch(
        `${API_URL}/api/checkout/create-session`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-XSRF-TOKEN': xsrfToken,
          },
          body: JSON.stringify({
            amount: Math.round(course.price * 100),
            courseId: course.id,
            userEmail: user.email,
          }),
        }
      );
      const { orderId } = await sessionRes.json();
      if (!orderId || !window.Razorpay) {
        throw new Error('Payment initiation failed.');
      }

      // 2) Launch Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderId,
        name: 'VetDigit LMS',
        description: course.title,
        image: '/logo.png',
        handler: async (response) => {
          try {
            // 3) Verify payment on server
            await fetch(`${API_URL}/sanctum/csrf-cookie`, {
              credentials: 'include',
            });
            const xsrfVerify = getCookie('XSRF-TOKEN');

            const verifyRes = await fetch(
              `${API_URL}/api/payment/verify`,
              {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                  'X-XSRF-TOKEN': xsrfVerify,
                },
                body: JSON.stringify({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                  courseId: course.id,
                  userEmail: user.email,
                }),
              }
            );
            const { success } = await verifyRes.json();
            if (!success) {
              toast.error('Payment verification failed.');
              return;
            }

            // 4) Start grant-access spinner
            setIsGranting(true);

            // 5) Fetch chapters & grant Drive access
            await fetch(`${API_URL}/sanctum/csrf-cookie`, {
              credentials: 'include',
            });
            const driveXsrf = getCookie('XSRF-TOKEN');

            const chapRes = await fetch(
              `${API_URL}/api/courses/${courseId}/chapters`,
              {
                credentials: 'include',
                headers: { Accept: 'application/json' },
              }
            );
            const chapters = await chapRes.json();
            const folders = Array.isArray(chapters)
              ? chapters
                  .filter((ch) => ch.drive_folder_id)
                  .map((ch) => ch.drive_folder_id)
              : [];

            const grantPromises = folders.map(async (folderId) => {
              const res = await fetch(
                `${API_URL}/api/drive/grant-access`,
                {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': driveXsrf,
                  },
                  body: JSON.stringify({
                    user_id: user.id,
                    folder_id: folderId,
                  }),
                }
              );
              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(
                  errData.message || `Grant-access failed: ${res.status}`
                );
              }
            });

            await Promise.all(grantPromises);

            // 6) All done → toast + redirect
            toast.success('Payment successful and access granted!');
            router.push(
              `/payment-success?orderId=${response.razorpay_order_id}` +
                `&paymentId=${response.razorpay_payment_id}` +
                `&courseId=${course.id}`
            );
          } catch (err) {
            console.error('Post-payment error:', err);
            toast.error(err.message || 'Something went wrong after payment.');
          } finally {
            setIsGranting(false);
          }
        },
        prefill: { email: user.email },
        theme: { color: '#0d47a1' },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error('Payment initiation failed:', err);
      toast.error(err.message || 'Payment initiation error.');
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      {/* Cancel modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Cancel Payment?</h2>
            <p className="mb-6">
              Do you want to cancel and return to dashboard?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes, cancel
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-900"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Providing access spinner overlay */}
      {isGranting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-60 text-white p-4">
          <LoaderCircle className="animate-spin h-12 w-12 mb-4" />
          <p className="text-xl">Providing access, please wait…</p>
        </div>
      )}

      {/* Main checkout UI */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <button
          onClick={() => setShowConfirm(true)}
          className="text-blue-600 hover:underline"
        >
          &larr; Cancel Checkout
        </button>

        <h1 className="text-4xl font-bold text-gray-900">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8 bg-white p-6 rounded-lg shadow">
          {/* Course summary */}
          <div className="flex-1 space-y-4">
            <h2 className="text-2xl font-semibold">Course Summary</h2>
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full max-w-lg rounded"
            />
            <h3 className="text-xl font-bold mt-4">{course.title}</h3>
            <p className="text-gray-700 mt-2">{course.description}</p>
          </div>

          {/* Order details */}
          <div className="w-full lg:w-1/3 bg-gray-50 p-6 rounded-lg shadow space-y-6">
            <h2 className="text-xl font-semibold">Order Details</h2>
            <div className="flex justify-between">
              <span className="text-gray-700">Course Price:</span>
              <span className="font-semibold text-blue-800">
                ₹{course.price}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Discount:</span>
              <span className="font-semibold text-blue-800">₹0</span>
            </div>
            <hr />
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-blue-800">₹{course.price}</span>
            </div>
            <button
              onClick={handlePayment}
              className="w-full bg-blue-800 text-white py-3 rounded hover:bg-blue-900 transition text-lg font-medium"
            >
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
