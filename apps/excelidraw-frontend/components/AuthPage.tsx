"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "../config";

export function AuthPage({isSignin}: {
    isSignin: boolean
}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const router = useRouter();

    const handleSubmit = async () => {
        // Basic validation
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

        const url = isSignin ? `${HTTP_BACKEND}/signin` : `${HTTP_BACKEND}/signup`;
        const body = isSignin 
            ? { username: email, password }
            : { username: email, password, name };

        try {
            console.log("Attempting auth:", { isSignin, url, body });
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });

            console.log("Response status:", response.status);
            const responseText = await response.text();
            console.log("Raw response:", responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.log("Failed to parse JSON, response text:", responseText);
                alert("Invalid response from server");
                return;
            }
            
            console.log("Parsed response data:", data);

            if (response.ok) {
                if (isSignin && data.token) {
                    localStorage.setItem("token", data.token);
                    console.log("Token saved, redirecting to dashboard");
                    router.push("/dashboard");
                } else if (!isSignin) {
                    console.log("Signup successful, redirecting to signin");
                    router.push("/signin");
                } else {
                    console.log("Signin response missing token");
                    alert("Signin failed: No token received");
                }
            } else {
                console.log("Auth failed:", data);
                alert("Authentication failed: " + (data.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Auth error:", error);
            alert("Error: " + error);
        }
    };

    return <div className="w-screen h-screen flex justify-center items-center">
        <div className="p-6 m-2 bg-white rounded shadow-lg">
            <h2 className="text-2xl font-bold mb-4">{isSignin ? "Sign In" : "Sign Up"}</h2>
            
            <div className="p-2">
                <input 
                    type="text" 
                    placeholder="Username (3-20 characters)" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>
            
            {!isSignin && (
                <div className="p-2">
                    <input 
                        type="text" 
                        placeholder="Name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
            )}
            
            <div className="p-2">
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>

            <div className="pt-4">
                <button 
                    className="bg-blue-500 text-white rounded p-2 w-full hover:bg-blue-600"
                    onClick={handleSubmit}
                >
                    {isSignin ? "Sign in" : "Sign up"}
                </button>
            </div>
            
            <div className="pt-2 text-center">
                {isSignin ? "Don't have an account? " : "Already have an account? "}
                <a 
                    href={isSignin ? "/signup" : "/signin"} 
                    className="text-blue-500 hover:underline"
                >
                    {isSignin ? "Sign up" : "Sign in"}
                </a>
            </div>
        </div>
    </div>
}