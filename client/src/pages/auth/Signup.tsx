// Signup.tsx
import React, { useState } from "react";
import { auth, db } from "@/firebase/firebase"; // Adjust path if needed
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // For password toggle icon

// Type definition for DialogProps, matching your Login.tsx
type DialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  actions: { label: string; handler: () => void }[];
};

// Re-using the Dialog component (or make it a shared component)
const Dialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  message,
  onClose,
  actions,
}) => {
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

const generateUniqueUserId = (): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const Signup = () => {
  const [signupMethod, setSignupMethod] = useState<"phone" | "email">("phone");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [gameMode, setGameMode] = useState("PUBG"); // Default
  const [gameId, setGameId] = useState("");
  const [country, setCountry] = useState("India"); // Default
  const [currency, setCurrency] = useState("INR"); // Default
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [error, setError] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // For password toggle

  const navigate = useNavigate();

  const handleSignup = async () => {
    setError("");
    setShowDialog(false);

    // Basic client-side validation
    if (!username || !password || !gameMode || !country || !currency) {
      setError("Please fill in all required fields.");
      setShowDialog(true);
      return;
    }

    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      setShowDialog(true);
      return;
    }

    // Password strength validation (example: min 6 chars)
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setShowDialog(true);
      return;
    }

    let userIdentifier = ""; // Will hold email or phone number for logging/storage
    let firebaseAuthUid = null; // Will hold UID from Firebase Auth if email signup

    try {
      const userId = generateUniqueUserId(); // Generate a unique user ID for Firestore document

      if (signupMethod === "email") {
        if (!email) {
          setError("Please enter your email address.");
          setShowDialog(true);
          return;
        }
        // Basic email format validation
        if (!/\S+@\S+\.\S+/.test(email)) {
          setError("Please enter a valid email address.");
          setShowDialog(true);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        firebaseAuthUid = userCredential.user.uid;
        userIdentifier = email;

        // Update user profile in Firebase Auth (display name)
        await updateProfile(userCredential.user, { displayName: username });

        // Store additional user data in Firestore
        await setDoc(doc(db, "usersignupdata", userId), {
          // Use the generated userId as the document ID
          firebaseUid: firebaseAuthUid, // Store Firebase Auth UID as well
          userId: userId, // Store the generated custom userId
          username: username,
          email: email,
          phoneNumber: null, // Ensure phoneNumber is null for email registrations
          gameMode: gameMode,
          gameId: gameId || null, // Store null if optional game ID is empty
          country: country,
          currency: currency,
          createdAt: new Date(),
        });

        console.log(
          "User registered with email:",
          userIdentifier,
          "and custom userId:",
          userId
        );
        navigate("/dashboard"); // Redirect to dashboard on success
      } else {
        // signupMethod === 'phone'
        if (!phoneNumber) {
          setError("Please enter your phone number.");
          setShowDialog(true);
          return;
        }
        // Basic phone number format validation (e.g., for +91 and 10 digits after that)
        const formattedPhoneNumber = phoneNumber.startsWith("+91")
          ? phoneNumber
          : `+91${phoneNumber}`;
        if (!/^\+91\d{10}$/.test(formattedPhoneNumber)) {
          setError(
            "Please enter a valid 10-digit Indian phone number (e.g., 7991423042 or +917991423042)."
          );
          setShowDialog(true);
          return;
        }
        userIdentifier = formattedPhoneNumber;

        await setDoc(doc(db, "usersignupdata", userId), {
          // Use the generated userId as the document ID
          firebaseUid: null, // No Firebase Auth UID for phone+password direct Firestore signup
          userId: userId, // Store the generated custom userId
          username: username,
          email: null, // Ensure email is null for phone registrations
          phoneNumber: formattedPhoneNumber,
          password: password, // 🔥🔥🔥 INSECURE: Store hashed password in production 🔥🔥🔥
          gameMode: gameMode,
          gameId: gameId || null,
          country: country,
          currency: currency,
          createdAt: new Date(),
        });

        console.log(
          "User registered with phone:",
          userIdentifier,
          "and custom userId:",
          userId
        );
        navigate("/dashboard"); // Redirect to dashboard on success
      }
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred during signup.";
      if (err.code) {
        switch (err.code) {
          case "auth/email-already-in-use":
            errorMessage =
              "Email address is already in use by another account.";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address.";
            break;
          case "auth/weak-password":
            errorMessage =
              "Password is too weak. Please choose a stronger one.";
            break;
          // You might add checks for duplicate phone numbers in Firestore if not using Firebase Auth's phone method
          default:
            errorMessage = err.message;
        }
      }
      setError(errorMessage);
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
          Create your tournament account
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-[#2A2A3A] p-1 rounded-lg mb-8">
          <button
            onClick={() => setSignupMethod("phone")}
            className={`flex-1 py-3 text-lg font-semibold rounded-lg transition-colors duration-200 ${
              signupMethod === "phone"
                ? "bg-[#3A3A4A] shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Phone Number
          </button>
          <button
            onClick={() => setSignupMethod("email")}
            className={`flex-1 py-3 text-lg font-semibold rounded-lg transition-colors duration-200 ${
              signupMethod === "email"
                ? "bg-[#3A3A4A] shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Email
          </button>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col space-y-6">
          <label className="block text-gray-300 text-sm font-semibold">
            Username
          </label>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus:border-[#9C27B0] outline-none px-4 py-3 text-white placeholder-gray-500 text-lg transition-colors duration-200"
          />

          {signupMethod === "phone" && (
            <>
              <label className="block text-gray-300 text-sm font-semibold">
                Phone Number
              </label>
              <div className="flex items-center bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus-within:border-[#9C27B0] transition-colors duration-200">
                <span className="text-gray-400 px-4 py-3 border-r border-[#3A3A4A]">
                  +91
                </span>{" "}
                {/* Assuming India, adjust as needed */}
                <input
                  type="tel"
                  placeholder="7991423042"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder-gray-500 text-lg"
                />
              </div>
            </>
          )}

          {signupMethod === "email" && (
            <>
              <label className="block text-gray-300 text-sm font-semibold">
                Email
              </label>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus:border-[#9C27B0] outline-none px-4 py-3 text-white placeholder-gray-500 text-lg transition-colors duration-200"
              />
            </>
          )}

          <label className="block text-gray-300 text-sm font-semibold">
            Password
          </label>
          <div className="relative bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus-within:border-[#9C27B0] transition-colors duration-200">
            <input
              type={showPassword ? "text" : "password"}
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

          <label className="block text-gray-300 text-sm font-semibold">
            Game Mode
          </label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value)}
            className="bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus:border-[#9C27B0] outline-none px-4 py-3 text-white text-lg appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1.5em",
            }}
          >
            <option value="PUBG">PUBG</option>
            <option value="BGMI">BGMI</option>
          </select>

          <label className="block text-gray-300 text-sm font-semibold">
            Game ID (Optional)
          </label>
          <input
            type="text"
            placeholder="Your in-game ID"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus:border-[#9C27B0] outline-none px-4 py-3 text-white placeholder-gray-500 text-lg transition-colors duration-200"
          />

          <label className="block text-gray-300 text-sm font-semibold">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus:border-[#9C27B0] outline-none px-4 py-3 text-white text-lg appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1.5em",
            }}
          >
            <option value="India">India</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Other Countries">Other Countries</option>
          </select>

          <label className="block text-gray-300 text-sm font-semibold">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-[#2A2A3A] rounded-lg border border-[#3A3A4A] focus:border-[#9C27B0] outline-none px-4 py-3 text-white text-lg appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1.5em",
            }}
          >
            <option value="INR">INR</option>
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
          </select>

          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="termsAgreement"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="form-checkbox h-5 w-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            <label
              htmlFor="termsAgreement"
              className="ml-3 text-sm text-gray-400"
            >
              I agree to the{" "}
              <a
                href="/terms"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Privacy Policy
              </a>
            </label>
          </div>
        </div>

        {/* Create Account Button */}
        <button
          onClick={handleSignup}
          className="w-full mt-8 py-3 rounded-lg font-bold text-lg text-white bg-gradient-to-r from-[#9C27B0] to-[#E040FB] hover:from-[#E040FB] hover:to-[#9C27B0] transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-opacity-50"
        >
          Create Account
        </button>

        {/* Login Link */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-purple-400 hover:text-purple-300 font-semibold focus:outline-none"
          >
            Sign In
          </Link>
        </p>

        {/* Error Dialog */}
        <Dialog
          isOpen={showDialog}
          title="Signup Error"
          message={error}
          onClose={() => setShowDialog(false)}
          actions={[{ label: "Close", handler: () => setShowDialog(false) }]}
        />
      </div>
    </div>
  );
};

export default Signup;
