import React, { useState } from "react"
import "./SignupPage.css"
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, UserPlus, ShieldCheck, Command } from "lucide-react";
import { useDispatch } from "react-redux";
import { signupUser, googleLogin } from "../../redux/slices/authSlice";
import { GoogleLogin } from '@react-oauth/google';

function SignupPage() {
    const dispatch = useDispatch();
    const [Email, setEmail] = useState();
    const [Password, setPassword] = useState();
    const [Role, setRole] = useState("member");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await dispatch(signupUser({ email: Email, password: Password, role: Role }));
        if (signupUser.fulfilled.match(result)) {
            alert("Account created!");
            navigate("/login");
        } else {
            alert(result.payload || "Signup failed");
            console.log(result.payload);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        const result = await dispatch(googleLogin(credentialResponse.credential));
        if (googleLogin.fulfilled.match(result)) {
            navigate("/linear");
        } else {
            alert("Google Signup Failed");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">
                        <Command size={32} color="var(--accent-primary)" />
                    </div>
                    <h1>Create your account</h1>
                    <p>Start managing your projects with Project-Management-Tool.</p>
                </div>

                <div className="google-auth-section">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => alert("Google Signup Failed")}
                        useOneTap
                        theme="filled_black"
                        shape="rectangular"
                        text="signup_with_google"
                    />
                </div>

                <div className="auth-separator">
                    <span>OR</span>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-field">
                        <input
                            type="email"
                            placeholder="Email address"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <input
                            type="password"
                            placeholder="Create password (min. 8 characters)"
                            autoComplete="new-password"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-field">
                        <select onChange={(e) => setRole(e.target.value)} value={Role}>
                            <option value="member">Join as Project Member</option>
                            <option value="manager">Join as Project Manager</option>
                        </select>
                    </div>

                    <button type="submit" className="auth-submit-btn">
                        Create Account
                    </button>
                </form>

                <div className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}

export default SignupPage;
