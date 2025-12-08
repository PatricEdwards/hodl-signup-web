import React, { useEffect, useMemo, useRef, useState } from "react";

// Adjust paths if your images live elsewhere
import Logo from "./images/Hodl-Logo.png";
import CryptoGraphic from "./images/crypto-graphic.png";

const API_BASE =
    "https://dev-backend.blackmeadow-dfca6458.southafricanorth.azurecontainerapps.io";

// Store links
const DOWNLOAD_IOS_URL = "https://apps.apple.com/za/app/hodl-otc/id6751191412";
const DOWNLOAD_ANDROID_URL =
    "https://play.google.com/store/apps/details?id=com.hodl.otc&pcampaignid=web_share";

// Simple hook to detect mobile by width
function useIsMobile(breakpoint: number = 820) {
    const getIsMobile = () =>
        typeof window !== "undefined" ? window.innerWidth < breakpoint : false;

    const [isMobile, setIsMobile] = useState(getIsMobile());

    useEffect(() => {
        const onResize = () => setIsMobile(getIsMobile());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [breakpoint]);

    return isMobile;
}

type Step = "signup" | "verify" | "download";

function App() {
    const [step, setStep] = useState<Step>(() => {
        if (typeof window === "undefined") return "signup";
        return /\/download\/?$/i.test(window.location.pathname) ? "download" : "signup";
    });

    const basePath = useMemo(() => {
        if (typeof window === "undefined") return "/";
        const withoutDownload = window.location.pathname.replace(/\/download\/?$/i, "");
        if (withoutDownload === "" || withoutDownload === "/") return "/";
        return withoutDownload.replace(/\/+$/, "");
    }, []);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);

    const [otp, setOtp] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const isMobile = useIsMobile(820);

    const otpInputRef = useRef<HTMLInputElement | null>(null);

    const handleSignUp = async () => {
        setError(null);
        setSuccess(null);

        if (!email || !password) {
            setError("Please enter email and password.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/Accounts/sign-up`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-Api-Version": "1",
                },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Sign up failed.");
            }

            // Move to OTP verify step. Keep the email so we can verify it.
            setStep("verify");
            setSuccess("Account created! We sent an OTP to your email.");
            setPassword(""); // clear password; not needed anymore
            setShowPw(false);

            // Focus OTP field shortly after UI swap
            setTimeout(() => otpInputRef.current?.focus(), 0);
        } catch (e: any) {
            setError(e?.message || "Sign up failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setError(null);
        setSuccess(null);

        if (!email || !otp) {
            setError("Please enter your OTP.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/Accounts/verify-email`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-Api-Version": "1",
                },
                body: JSON.stringify({ email, otp }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "OTP verification failed.");
            }

            setOtp("");
            setSuccess("Email verified!");
            // Go to downloads step
            setStep("download");
        } catch (e: any) {
            setError(e?.message || "OTP verification failed.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;
        const path =
            step === "download"
                ? `${basePath === "/" ? "" : basePath}/download`
                : basePath;
        if (window.location.pathname !== path) {
            window.history.replaceState(null, "", path || "/");
        }
    }, [basePath, step]);

    // Styles
    const styles: { [k: string]: React.CSSProperties } = useMemo(
        () => ({
            page: {
                backgroundColor: "#0f0f10",
                color: "#fff",
                minHeight: "100vh",
                width: "100vw",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: isMobile ? 16 : 60, // smaller padding on mobile
                boxSizing: "border-box",
                fontFamily: "Arial, sans-serif",
            },
            shell: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? 24 : 120,
                width: "100%",
                maxWidth: 1200,
                flexDirection: isMobile ? "column" : "row",
            },
            card: {
                background: "#111216",
                borderRadius: 16,
                padding: isMobile ? 20 : 32,
                width: isMobile ? "100%" : 420,
                maxWidth: isMobile ? 560 : undefined,
                boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.1)",
            },
            logo: { height: 36, marginBottom: 20 },
            heading: {
                fontSize: isMobile ? 22 : 24,
                fontWeight: 700,
                marginBottom: 8,
                color: "#d9d9e3",
                textAlign: isMobile ? "center" : "left",
            },
            subheading: {
                fontSize: 13,
                color: "#b5b5c9",
                marginBottom: 16,
                textAlign: isMobile ? "center" : "left",
            },
            label: { fontSize: 14, marginBottom: 8, color: "#c9c9d4" },
            input: {
                width: "100%",
                padding: isMobile ? "14px 14px" : "14px 16px",
                borderRadius: 10,
                border: "1px solid #2a2b31",
                background: "#1a1b21",
                color: "#fff",
                outline: "none",
                fontSize: 16, // prevents iOS zoom on focus
                boxSizing: "border-box",
            },
            inputWrap: { marginBottom: 16 },

            // PASSWORD field wrapper (so eye centers correctly on input height)
            pwFieldWrap: { position: "relative" },

            eyeBtn: {
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#bfbfca",
                cursor: "pointer",
                fontSize: 18,
                padding: 0,
                lineHeight: 1,
                height: 24,
                width: 24,
            },

            btn: {
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid #a20d68",
                background:
                    "linear-gradient(180deg, rgba(255,0,142,0.95) 0%, rgba(162,13,104,0.95) 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                marginTop: 8,
                textAlign: "center",
            },
            btnDisabled: { opacity: 0.6, cursor: "not-allowed" },

            helper: {
                fontSize: 12,
                color: "#b5b5c9",
                marginTop: 8,
                textAlign: isMobile ? "center" : "left",
            },

            error: {
                background: "#3a1216",
                border: "1px solid #6f1d28",
                color: "#ffb3c0",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                marginTop: 6,
            },
            success: {
                background: "#123a1e",
                border: "1px solid #1d6f39",
                color: "#b7ffcf",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                marginTop: 6,
            },

            artWrap: {
                flex: 1,
                minWidth: 380,
                textAlign: "center",
                display: isMobile ? "none" : "block", // hide on mobile
            },
            art: { width: "100%", maxWidth: 620, height: "auto", display: "block" },

            // Download section styles
            storeButtons: {
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 12,
                marginTop: 8,
            },
            storeLink: {
                display: "inline-block",
                textDecoration: "none",
                borderRadius: 12,
                border: "1px solid #2a2b31",
                background: "#1a1b21",
                padding: "12px 16px",
                fontWeight: 700,
                fontSize: 16,
                color: "#ffffff",
                textAlign: "center" as const,
            },
            smallRow: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginTop: 8,
            },
            smallButtonLink: {
                background: "transparent",
                border: "none",
                color: "#c9c9ff",
                cursor: "pointer",
                padding: 0,
                fontSize: 13,
                textDecoration: "underline",
            },
        }),
        [isMobile]
    );

    return (
        <div style={styles.page}>
            {/* Ensure you have this in public/index.html for proper mobile scaling:
          <meta name="viewport" content="width=device-width, initial-scale=1" /> */}
            <div style={styles.shell}>
                <div style={styles.card}>
                    <img src={Logo} alt="HODL OTC" style={styles.logo} />

                    {/* Heading + subheading based on step */}
                    <div style={styles.heading}>
                        {step === "signup"
                            ? "Create your account"
                            : step === "verify"
                                ? "Verify your email"
                                : "Get the app"}
                    </div>

                    {step === "verify" && (
                        <div style={styles.subheading}>
                            We’ve emailed an OTP to <strong>{email}</strong>. Enter it below to
                            confirm your email.
                        </div>
                    )}

                    {step === "download" && (
                        <div style={styles.subheading}>
                            Your email is verified. Download the HODL OTC mobile app to get started.
                        </div>
                    )}

                    {/* Body per step */}
                    {step === "signup" ? (
                        <>
                            <div style={styles.inputWrap}>
                                <div style={styles.label}>Email</div>
                                <input
                                    style={styles.input}
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    inputMode="email"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                />
                            </div>

                            <div style={styles.inputWrap}>
                                <div style={styles.label}>Password</div>

                                {/* Wrapper keeps eye centered relative to the input */}
                                <div style={styles.pwFieldWrap}>
                                    <input
                                        style={styles.input}
                                        type={showPw ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPw ? "Hide password" : "Show password"}
                                        onClick={() => setShowPw((s) => !s)}
                                        style={styles.eyeBtn}
                                        title={showPw ? "Hide password" : "Show password"}
                                    >
                                        {showPw ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            {error && <div style={styles.error}>{error}</div>}
                            {success && <div style={styles.success}>{success}</div>}

                            <button
                                style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                                onClick={handleSignUp}
                                disabled={loading}
                            >
                                {loading ? "Creating..." : "Sign up"}
                            </button>

                            <div style={styles.helper}>
                                By creating an account you agree to our terms and privacy policy.
                            </div>
                        </>
                    ) : step === "verify" ? (
                        <>
                            <div style={styles.inputWrap}>
                                <div style={styles.label}>One-time password (OTP)</div>
                                <input
                                    ref={otpInputRef}
                                    style={styles.input}
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Enter the code"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>

                            {error && <div style={styles.error}>{error}</div>}
                            {success && <div style={styles.success}>{success}</div>}

                            <button
                                style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
                                onClick={handleVerify}
                                disabled={loading}
                            >
                                {loading ? "Verifying..." : "Verify email"}
                            </button>

                            <div style={styles.smallRow}>
                                <button
                                    type="button"
                                    style={styles.smallButtonLink}
                                    onClick={() => setStep("signup")}
                                    disabled={loading}
                                >
                                    Use a different email
                                </button>
                                {/* Add a "Resend OTP" handler later if you expose an endpoint */}
                            </div>
                        </>
                    ) : (
                        // Download step
                        <>
                            {error && <div style={styles.error}>{error}</div>}
                            {success && <div style={styles.success}>{success}</div>}

                            <div style={styles.inputWrap}>
                                <div style={styles.label}>Download the HODL OTC app</div>
                                <div style={styles.storeButtons}>
                                    <a
                                        href={DOWNLOAD_IOS_URL}
                                        style={styles.storeLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download for iOS
                                    </a>
                                    <a
                                        href={DOWNLOAD_ANDROID_URL}
                                        style={styles.storeLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download for Android
                                    </a>
                                </div>
                            </div>

                            <div style={styles.helper}>
                                You can close this window after installing the app.
                            </div>
                        </>
                    )}
                </div>

                {/* Hidden on mobile via styles.artWrap */}
                <div style={styles.artWrap}>
                    <img src={CryptoGraphic} alt="Crypto illustration" style={styles.art} />
                </div>
            </div>
        </div>
    );
}

export default App;
