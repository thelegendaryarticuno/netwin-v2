import React, { useState } from 'react';
import { auth, db } from '@/firebase/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import {
  doc,
  getDoc,
  query,
  getDocs,
  collection,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async () => {
    setError('');
    setShowDialog(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        console.log('Logged in successfully with email:', user.email);
        navigate('/dashboard');
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

    if (!phoneNumber || !password) {
      setError('Please enter both phone number and password.');
      setShowDialog(true);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let foundUser = false;
        querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
          const userData = docSnap.data();
          if (userData.password === password) {
            console.log('Logged in successfully with phone:', phoneNumber);
            navigate('/dashboard');
            foundUser = true;
          }
        });

        if (!foundUser) {
          setError('Incorrect phone number or password.');
          setShowDialog(true);
        }
      } else {
        setError('No user found with this phone number. Please sign up.');
        setShowDialog(true);
      }
    } catch (err: any) {
      console.error('Phone login error:', err);
      setError('An error occurred during phone login. Please try again.');
      setShowDialog(true);
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

        <div className="flex bg-[#2A2A3A] p-1 rounded-lg mb-8">
          <button
            onClick={() => {
              setLoginMethod('phone');
              setPhoneNumber('');
              setPassword('');
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
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 py-3 text-lg font-semibold rounded-lg transition-colors duration-200 ${
              loginMethod === 'email' ? 'bg-[#3A3A4A] shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Email
          </button>
        </div>

        {loginMethod === 'phone' && (
          <div className="flex flex-col space-y-6">
            <label className="block text-gray-300 text-sm font-semibold">Phone Number</label>
            <div className="flex items-center bg-[#2A2A3A] rounded-lg border border-[#3A3A4A]">
              <span className="text-gray-400 px-4 py-3 border-r border-[#3A3A4A]">+91</span>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder-gray-500 text-lg"
              />
            </div>

            <label className="block text-gray-300 text-sm font-semibold">Password</label>
            <div className="relative bg-[#2A2A3A] rounded-lg border border-[#3A3A4A]">
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

        {loginMethod === 'email' && (
          <div className="flex flex-col space-y-6">
            <label className="block text-gray-300 text-sm font-semibold">Email</label>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] px-4 py-3 text-white placeholder-gray-500 text-lg"
            />
            <label className="block text-gray-300 text-sm font-semibold">Password</label>
            <div className="relative bg-[#2A2A3A] rounded-lg border border-[#3A3A4A]">
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

        <button
          onClick={loginMethod === 'email' ? handleEmailLogin : handlePhoneLogin}
          className="w-full mt-8 py-3 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-[#9C27B0] to-[#E040FB] hover:from-[#E040FB] hover:to-[#9C27B0] transition-all duration-300 transform hover:scale-105"
        >
          Sign In
        </button>

        <p className="text-center text-gray-400 text-sm mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            Sign up
          </button>
        </p>

        <p className="text-center text-gray-500 text-xs mt-8 px-4">
          By logging in, you agree to our{' '}
          <a href="/terms" className="text-gray-400 hover:text-white underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="text-gray-400 hover:text-white underline">Privacy Policy</a>.
        </p>

        <Dialog
          isOpen={showDialog}
          title={error.includes('registered') || error.includes('found') ? 'Not Registered' : 'Login Error'}
          message={error}
          onClose={() => setShowDialog(false)}
          actions={[
            { label: 'Close', handler: () => setShowDialog(false) },
            ...(error.includes('registered') || error.includes('found') ? [{ label: 'Sign Up', handler: () => navigate('/signup') }] : []),
          ]}
        />
      </div>
    </div>
  );
};

export default Login;
