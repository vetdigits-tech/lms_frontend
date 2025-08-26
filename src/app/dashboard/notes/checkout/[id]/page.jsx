"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { LoaderCircle, Lock, FileText, CheckCircle, IndianRupee, Star, CreditCard, CloudCheck } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function NotesCheckout() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id;

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState('');

  // Safe calculation of price and isFree - add null check
  const price = subject ? parseFloat(subject.price || 0) : 0;
  const isFree = price === 0;

  // Helper function to get cookie value
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  // Helper function to get CSRF token
  const getCsrfToken = async () => {
    try {
      await fetch(`${API_URL}/sanctum/csrf-cookie`, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
    } catch (err) {
      console.error('Failed to get CSRF token:', err);
    }
  };

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (url, options = {}) => {
    // Ensure we have CSRF token
    await getCsrfToken();
    
    // Get CSRF token from cookie
    const csrfToken = getCookie('XSRF-TOKEN');
    
    const defaultOptions = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(csrfToken && { "X-XSRF-TOKEN": csrfToken }),
        ...options.headers,
      },
    };

    return fetch(url, { ...defaultOptions, ...options });
  };

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        // Check if script is already loaded
        if (window.Razorpay) {
          setIsScriptLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error("Failed to load Razorpay script");
          resolve(false);
        };
        document.head.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  // Initialize CSRF token on component mount
  useEffect(() => {
    getCsrfToken();
  }, []);

  // Fetch subject details
  useEffect(() => {
    async function fetchSubject() {
      try {
        const res = await fetch(`${API_URL}/api/notes/subjects/${subjectId}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        
        if (!res.ok) throw new Error(`Failed to load subject: ${res.status}`);
        const data = await res.json();
        setSubject(data);
      } catch (err) {
        console.error("Failed to load subject:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (subjectId) {
      fetchSubject();
    }
  }, [subjectId]);

  // Handle free enrollment with proper access granting
  const handleFreeEnroll = async () => {
    if (enrolling) return;
    
    setEnrolling(true);
    setError(null);
    setEnrollmentStep('Creating enrollment...');

    try {
      const res = await makeAuthenticatedRequest(`${API_URL}/api/notes/${subjectId}/purchase`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to enroll");
      }

      const data = await res.json();
      
      // Check if Google Drive access is needed
      if (subject && subject.drive_folder_id) {
        setEnrollmentStep('Providing access to notes...');
        
        // Wait a bit to show the progress message
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setEnrollmentStep('Access granted successfully!');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Show success message and redirect
      router.push(`/dashboard/notes/${subjectId}?enrolled=true&type=free`);
    } catch (err) {
      console.error("Enrollment failed:", err);
      setError(err.message);
      setEnrollmentStep('');
    } finally {
      setEnrolling(false);
    }
  };

  // Handle paid course purchase with enhanced progress tracking
  const handlePurchase = async () => {
    if (enrolling || !isScriptLoaded) return;
    
    setEnrolling(true);
    setError(null);
    setEnrollmentStep('Initializing payment...');

    try {
      // Create payment session
      const sessionRes = await makeAuthenticatedRequest(`${API_URL}/api/notes/checkout/create-session`, {
        method: "POST",
        body: JSON.stringify({
          amount: Math.round(price * 100), // Convert to paisa
          subjectId: parseInt(subjectId),
        }),
      });

      if (!sessionRes.ok) {
        const errorData = await sessionRes.json();
        throw new Error(errorData.error || "Failed to create payment session");
      }

      const sessionData = await sessionRes.json();
      setEnrollmentStep('Opening payment gateway...');

      // Initialize Razorpay
      const options = {
        key: sessionData.key,
        amount: sessionData.amount,
        currency: sessionData.currency,
        order_id: sessionData.orderId,
        name: "VETDIGIT LMS",
        description: `Notes: ${sessionData.subjectName}`,
        image: "/logo.png", // Your app logo
        prefill: {
          name: sessionData.userName,
          email: sessionData.userEmail,
        },
        theme: {
          color: "#3B82F6", // Your brand color
        },
        handler: async function (response) {
          console.log("Payment successful:", response);
          setEnrollmentStep('Payment successful! Verifying...');
          
          // Payment successful, verify with backend
          try {
            const verifyRes = await makeAuthenticatedRequest(`${API_URL}/api/notes/payment/verify`, {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                subjectId: parseInt(subjectId),
              }),
            });

            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              setEnrollmentStep('Payment verified! Setting up access...');
              
              // Check if Google Drive access was granted
              if (verifyData.subject && verifyData.subject.drive_folder_id) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Show progress
                setEnrollmentStep('Google Drive access granted!');
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              // Success! Redirect to notes
              router.push(`/dashboard/notes/${subjectId}?enrolled=true&payment=success`);
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (err) {
            console.error("Payment verification failed:", err);
            setError("Payment verification failed. Please contact support if money was deducted.");
            setEnrollmentStep('');
            setEnrolling(false);
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Payment cancelled");
            
            // Payment cancelled - send failure notification
            makeAuthenticatedRequest(`${API_URL}/api/notes/payment/failed`, {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: sessionData.orderId,
                subjectId: parseInt(subjectId),
                error: "Payment cancelled by user",
              }),
            }).catch(console.error);
            
            setEnrolling(false);
            setEnrollmentStep('');
          },
        },
      };

      // Create and open Razorpay checkout
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        console.error("Payment failed:", response.error);
        
        // Send failure notification
        makeAuthenticatedRequest(`${API_URL}/api/notes/payment/failed`, {
          method: "POST",
          body: JSON.stringify({
            razorpay_order_id: sessionData.orderId,
            subjectId: parseInt(subjectId),
            error: response.error.description,
          }),
        }).catch(console.error);
        
        setError(`Payment failed: ${response.error.description}`);
        setEnrollmentStep('');
        setEnrolling(false);
      });

      rzp.open();

    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError(err.message);
      setEnrollmentStep('');
      setEnrolling(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="animate-spin text-blue-500 mx-auto mb-4" size={32} />
          <p className="text-gray-600">Loading subject details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">Error</h2>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <div className="space-x-2">
              <button
                onClick={() => {
                  setError(null);
                  setEnrollmentStep('');
                  // Re-initialize CSRF token
                  getCsrfToken();
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2"
              >
                Try Again
              </button>
              <button
                onClick={() => router.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enrollment progress overlay
  if (enrolling && enrollmentStep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-6">
              {enrollmentStep.includes('access') || enrollmentStep.includes('Drive') ? (
                <CloudCheck className="animate-pulse text-green-500 mx-auto mb-4" size={48} />
              ) : (
                <LoaderCircle className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isFree ? 'Enrolling you...' : 'Processing Payment...'}
            </h3>
            <p className="text-gray-600 mb-4">{enrollmentStep}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: enrollmentStep.includes('Creating') ? '25%' :
                         enrollmentStep.includes('Payment successful') ? '50%' :
                         enrollmentStep.includes('verified') || enrollmentStep.includes('access') ? '75%' :
                         enrollmentStep.includes('granted') ? '100%' : '25%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Subject not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center text-sm"
          >
            ← Back to Notes
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Left: Subject Details */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Subject Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <img
                      src={subject.thumbnail_url || "/placeholder.png"}
                      alt={subject.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {subject.name}
                    </h2>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {subject.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {subject.chapters?.length || 0} Chapters
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        Digital Notes
                      </span>
                      {subject.drive_folder_id && (
                        <span className="flex items-center gap-1">
                          <CloudCheck className="w-4 h-4" />
                          Google Drive Access
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapters List (Locked Preview) */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gray-400" />
                  Course Content
                </h3>
                
                {subject.chapters && subject.chapters.length > 0 ? (
                  <div className="space-y-2">
                    {subject.chapters.map((chapter, index) => (
                      <motion.div
                        key={chapter.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-60"
                      >
                        <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">
                            Chapter {index + 1}: {chapter.name}
                          </p>
                        </div>
                        <FileText className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Chapter content will be available after enrollment</p>
                  </div>
                )}

                {/* Features */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">What you'll get:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Access to all PDF chapters
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Lifetime access to content
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      View online (Non downloadable)
                    </li>
                    {subject.drive_folder_id && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Direct Google Drive access
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Regular content updates
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Checkout Card */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6 sticky top-6"
            >
              {/* Price Section */}
              <div className="text-center mb-6">
                {isFree ? (
                  <div>
                    <div className="text-3xl font-bold text-green-600 mb-2">FREE!</div>
                    <p className="text-sm text-gray-600">No cost - Enroll immediately</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center text-3xl font-bold text-gray-900 mb-2">
                      <IndianRupee className="w-6 h-6" />
                      {price.toLocaleString("en-IN")}
                    </div>
                    <p className="text-sm text-gray-600">One-time payment for lifetime access</p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="space-y-4">
                {isFree ? (
                  <button
                    onClick={handleFreeEnroll}
                    disabled={enrolling}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {enrolling ? (
                      <>
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Free Enroll Now
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={enrolling || !isScriptLoaded}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {enrolling ? (
                      <>
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : !isScriptLoaded ? (
                      <>
                        <LoaderCircle className="w-4 h-4 animate-spin" />
                        Loading Payment...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay ₹{price.toLocaleString("en-IN")}
                      </>
                    )}
                  </button>
                )}

                {/* Security Badge */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    Secure checkout powered by Razorpay
                  </p>
                </div>
              </div>

              {/* Course Info */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chapters:</span>
                  <span className="font-medium">{subject.chapters?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Access:</span>
                  <span className="font-medium">Lifetime</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium">PDF</span>
                </div>
                {subject.drive_folder_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Drive Access:</span>
                    <span className="font-medium text-green-600">Included</span>
                  </div>
                )}
                {!isFree && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment:</span>
                    <span className="font-medium">One-time</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
