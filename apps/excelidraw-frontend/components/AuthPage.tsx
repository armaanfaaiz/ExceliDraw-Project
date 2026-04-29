"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "../config";
import { 
    Mail, 
    Lock, 
    User, 
    ArrowRight, 
    Sparkles,
    Palette,
    Eye,
    EyeOff
} from "lucide-react";
import Link from "next/link";

export function AuthPage({isSignin}: {
    isSignin: boolean
}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        if (!email || !password) {
            alert("Please fill in all required fields");
            return;
        }
        
        if (email.length < 3 || email.length > 20) {
            alert("Username must be between 3 and 20 characters");
            return;
        }
        
        if (!isSignin && !name) {
            alert("Please fill in your name");
            return;
        }

        setIsLoading(true);
        const url = isSignin ? `${HTTP_BACKEND}/signin` : `${HTTP_BACKEND}/signup`;
        const body = isSignin 
            ? { username: email, password }
            : { username: email, password, name };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            const responseText = await response.text();
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                alert("Invalid response from server");
                return;
            }

            if (response.ok) {
                if (isSignin && data.token) {
                    localStorage.setItem("token", data.token);
                    router.push("/dashboard");
                } else if (!isSignin) {
                    router.push("/signin");
                } else {
                    alert("Signin failed: No token received");
                }
            } else {
                alert("Authentication failed: " + (data.message || "Unknown error"));
            }
        } catch (error) {
            alert("Error: " + error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
                        <Palette className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {isSignin ? "Welcome back" : "Create account"}
                    </h1>
                    <p className="text-slate-400">
                        {isSignin ? "Sign in to continue creating" : "Start your creative journey today"}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-xl">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
                        {/* Name field - only for signup */}
                        {!isSignin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="John Doe" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email/Username field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Enter username (3-20 chars)" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold rounded-xl hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{isSignin ? "Sign in" : "Create account"}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-800 text-slate-400">or</span>
                        </div>
                    </div>

                    {/* Toggle Link */}
                    <div className="text-center">
                        <p className="text-slate-400">
                            {isSignin ? "Don't have an account? " : "Already have an account? "}
                            <Link 
                                href={isSignin ? "/signup" : "/signin"} 
                                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                            >
                                {isSignin ? "Sign up" : "Sign in"}
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>Unleash your creativity</span>
                    </div>
                </div>
            </div>
        </div>
    );
}