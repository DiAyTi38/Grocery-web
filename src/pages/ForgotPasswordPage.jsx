
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }

    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (!confirmPassword) {
      setError("Vui lòng xác nhận mật khẩu mới.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const result = resetPassword(
      email,
      newPassword
    );

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSuccess(result.message);

    setTimeout(() => {
      navigate("/login", {
        replace: true,
      });
    }, 1500);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <Link to="/login" className="auth-brand">
          🛒 Smart Grocery
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">
            GROCERY STORE
          </span>

          <h1>Quên mật khẩu</h1>

          <p>
            Nhập email và mật khẩu mới để
            khôi phục tài khoản của bạn.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <label htmlFor="forgot-email">
            Email
          </label>

          <input
            id="forgot-email"
            type="email"
            placeholder="Nhập email đã đăng ký"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
          />


          <label htmlFor="forgot-password">
            Mật khẩu mới
          </label>

          <input
            id="forgot-password"
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
            autoComplete="new-password"
          />


          <label htmlFor="forgot-confirm-password">
            Xác nhận mật khẩu
          </label>

          <input
            id="forgot-confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            autoComplete="new-password"
          />


          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}


          {success && (
            <div
              className="auth-error"
              style={{
                color: "#08784f",
                background: "#e9f8f0",
              }}
            >
              {success}
              <br />
              Đang chuyển về trang đăng nhập...
            </div>
          )}


          <button
            type="submit"
            className="auth-primary auth-submit"
          >
            Đổi mật khẩu
          </button>

        </form>


        <div className="auth-switch">
          Nhớ mật khẩu rồi?{" "}
          <Link to="/login">
            Đăng nhập
          </Link>
        </div>


        <Link
          to="/login"
          className="back-home"
        >
          ← Quay lại đăng nhập
        </Link>

      </div>
    </div>
  );
}
