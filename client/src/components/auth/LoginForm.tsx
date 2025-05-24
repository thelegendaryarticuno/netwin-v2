// Login.tsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/firebase'; // Adjust path if needed
import { signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // For password toggle icon

type DialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  actions: { label: string; handler: () => void }[];
};

const Dialog: React.FC<DialogProps> = ({ isOpen, title, message, onClose, actions }) => {

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-xl p-6 max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-sm mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.handler}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(''); // Dedicated state for OTP
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false); // For email password toggle

  useEffect(() => {
    // Initialize reCAPTCHA verifier for phone auth
    if (loginMethod === 'phone' && !recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
          setShowDialog(true);
        }
      });
      verifier.render().then(() => {
        setRecaptchaVerifier(verifier);
      });
    }
    // Clean up reCAPTCHA if component unmounts or method changes
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        setRecaptchaVerifier(null);
      }
    };
  }, [loginMethod, recaptchaVerifier]);

  const handleEmailLogin = async () => {
    setError('');
    setShowDialog(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        console.log('Logged in successfully with email:', user.email);
        navigate('/dashboard'); // Redirect to dashboard or home
      } else {
        setError('You are not registered. Please sign up.');
        setShowDialog(true);
      }
    } catch (err: any) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No user found with this email.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Incorrect email or password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed login attempts. Please try again later.';
            break;
          default:
            errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setShowDialog(true);
    }
  };

  const handlePhoneLogin = async () => {
    setError('');
    setShowDialog(false);

    if (!confirmationResult) {
      // Step 1: Send OTP
      if (!phoneNumber || !recaptchaVerifier) {
        setError('Please enter a valid phone number.');
        setShowDialog(true);
        return;
      }

      try {
        const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        setConfirmationResult(result);
        alert('OTP sent to your phone! Please enter it.'); // Provide user feedback
      } catch (err: any) {
        let errorMessage = 'An unknown error occurred during OTP sending.';
        if (err instanceof FirebaseError) {
          switch (err.code) {
            case 'auth/invalid-phone-number':
              errorMessage = 'Invalid phone number format.';
              break;
            case 'auth/quota-exceeded':
              errorMessage = 'SMS quota exceeded or too many requests. Try again later.';
              break;
            case 'auth/captcha-check-failed':
              errorMessage = 'reCAPTCHA verification failed. Please try again.';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many requests. Please try again later.';
              break;
            default:
              errorMessage = err.message;
          }
        }
        setError(errorMessage);
        setShowDialog(true);
      }
    } else {
      // Step 2: Verify OTP
      if (!otp) {
        setError('Please enter the OTP.');
        setShowDialog(true);
        return;
      }

      try {
        const userCredential = await confirmationResult.confirm(otp);
        const user = userCredential.user;

        // Check if user exists in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          console.log('Logged in successfully with phone:', user.phoneNumber);
          navigate('/dashboard'); // Redirect to dashboard or home
        } else {
          setError('You are not registered. Please sign up.');
          setShowDialog(true);
        }
      } catch (err: any) {
        let errorMessage = 'An unknown error occurred during OTP verification.';
        if (err instanceof FirebaseError) {
          switch (err.code) {
            case 'auth/invalid-verification-code':
              errorMessage = 'Invalid OTP. Please check and try again.';
              break;
            case 'auth/code-expired':
              errorMessage = 'OTP has expired. Please request a new one.';
              break;
            case 'auth/too-many-requests':
              errorMessage = 'Too many OTP verification attempts. Please try again later.';
              break;
            default:
              errorMessage = err.message;
          }
        }
        setError(errorMessage);
        setShowDialog(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
      <div className="bg-[#0F0F1A] rounded-2xl shadow-xl w-full max-w-md p-8 sm:p-10 text-white font-sans">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#9C27B0] to-[#E040FB] text-center mb-2">
          Netwin v1.0
        </h1>
        <p className="text-center text-sm text-gray-400 mb-8">
          Login to your tournament account
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-[#2A2A3A] p-1 rounded-lg mb-8">
          <button
            onClick={() => {
              setLoginMethod('phone');
              setConfirmationResult(null); // Reset OTP state when switching
              setOtp(''); // Clear OTP field
              setPhoneNumber(''); // Clear phone number field
            }}
            className={`flex-1 py-3 text-lg font-semibold rounded-lg transition-colors duration-200 ${
              loginMethod === 'phone' ? 'bg-[#3A3A4A] shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Phone Number
          </button>
          <button
            onClick={() => {
              setLoginMethod('email');
              setConfirmationResult(null); // Reset OTP state when switching
              setEmail(''); // Clear email field
              setPassword(''); // Clear password field
            }}
            className={`flex-1 py-3 text-lg font-semibold rounded-lg transition-colors duration-200 ${
              loginMethod === 'email' ? 'bg-[#3A3A4A] shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Email
          </button>
        </div>

        {/* Form Fields */}
        {loginMethod === 'phone' && (
          <div className="flex flex-col space-y-6">
            <label className="block text-gray-300 text-sm font-semibold">Phone Number</label>
            <div className="flex items-center bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus-within:border-[#9C27B0] transition-colors duration-200">
              <span className="text-gray-400 px-4 py-3 border-r border-[#3A3A4A]">+91</span> {/* Assuming India, adjust as needed */}
              <input
                type="tel"
                placeholder="7991423042" // Example placeholder
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder-gray-500 text-lg"
                disabled={!!confirmationResult} // Disable phone input after OTP is sent
              />
            </div>
            <div id="recaptcha-container" className={confirmationResult ? 'hidden' : ''}></div> {/* reCAPTCHA renders here */}

            {confirmationResult && ( // Show OTP input only after OTP is sent
              <>
                <label className="block text-gray-300 text-sm font-semibold">OTP</label>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus:border-[#9C27B0] outline-none px-4 py-3 text-white placeholder-gray-500 text-lg transition-colors duration-200"
                />
              </>
            )}
          </div>
        )}

        {loginMethod === 'email' && (
          <div className="flex flex-col space-y-6">
            <label className="block text-gray-300 text-sm font-semibold">Email</label>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus:border-[#9C27B0] outline-none px-4 py-3 text-white placeholder-gray-500 text-lg transition-colors duration-200"
            />
            <label className="block text-gray-300 text-sm font-semibold">Password</label>
            <div className="relative bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus-within:border-[#9C27B0] transition-colors duration-200">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent px-4 py-3 pr-12 outline-none text-white placeholder-gray-500 text-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={loginMethod === 'email' ? handleEmailLogin : handlePhoneLogin}
          className="w-full mt-8 py-3 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-[#9C27B0] to-[#E040FB] hover:from-[#E040FB] hover:to-[#9C27B0] transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50"
        >
          {loginMethod === 'phone' && !confirmationResult ? 'Send OTP' : 'Sign In'}
        </button>

        {/* Signup Link */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-purple-400 hover:text-purple-300 font-semibold focus:outline-none"
          >
            Sign up
          </button>
        </p>

        {/* Terms and Privacy */}
        <p className="text-center text-gray-500 text-xs mt-8 px-4">
          By logging in, you agree to our{' '}
          <a href="/terms" className="text-gray-400 hover:text-white underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-gray-400 hover:text-white underline">
            Privacy Policy
          </a>
          .
        </p>

        {/* Error Dialog */}
        <Dialog
          isOpen={showDialog}
          title={error.includes('registered') ? 'Not Registered' : 'Login Error'}
          message={error}
          onClose={() => setShowDialog(false)}
          actions={[
            { label: 'Close', handler: () => setShowDialog(false) },
            ...(error.includes('registered') ? [{ label: 'Sign Up', handler: () => navigate('/signup') }] : [])
          ]}
        />
      </div>
    </div>
  );
};

export default Login;