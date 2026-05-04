import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, registerUser } from "../lib/api";
import { useToast } from "../providers/ToastProvider";
import { Button, Input, Card } from "../ui";

export default function AuthPage({ mode: initialMode = "login" }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        if (!form.email) {
          toast("Email is required for registration", { type: "error" });
          setLoading(false);
          return;
        }
        await registerUser({
          username: form.username,
          email: form.email,
          password: form.password,
        });
        toast("Registration successful! Please login.", { type: "success" });
        setMode("login");
      } else {
        await loginUser({
          username: form.username,
          password: form.password,
        });
        toast("Login successful!", { type: "success" });
        navigate("/");
      }
    } catch (error) {
      const message = error.response?.data?.detail || 
        (mode === "register" ? "Registration failed" : "Login failed");
      toast(message, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {mode === "login"
              ? "Login to track your downloads"
              : "Register to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Enter username"
            required
          />

          {mode === "register" && (
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email"
              required
            />
          )}

          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter password"
            required
            minLength={6}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {mode === "login" ? "Login" : "Register"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === "login" ? "Register here" : "Login here"}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
