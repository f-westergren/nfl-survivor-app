import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(email, password);
      navigate("/dashboard");
    } catch {
      setError("Signup failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="p-6 border rounded-lg shadow-md">
        <h2 className="text-xl mb-4">Sign Up</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 w-full mb-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 w-full mb-2"
        />
        <button className="bg-green-500 text-white px-4 py-2 rounded w-full">Sign Up</button>
        <p className="mt-2">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
