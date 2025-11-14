'use client'
import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse {
  message: string;
  user?: {
    id: number;
    name: string;
    email: string;
    created_at: string;
  };
  session_token?: string; // This should be a string, not an object
}

export default function Page() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setSuccess("");

  try {
    const response = await fetch('http://localhost:3001/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    if (data.user && data.tokens) {
      // Store tokens in localStorage for auto-login
      localStorage.setItem('auth_token', data.tokens.access_token);
      localStorage.setItem('refresh_token', data.tokens.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setSuccess('Account created successfully! Redirecting to home page...');
      console.log('Signup successful:', data.user);
      
      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else {
      setSuccess('Account created successfully! Please sign in.');
      setTimeout(() => {
        router.push('/signin');
      }, 2000);
    }
    
  } catch (err: any) {
    setError(err.message || 'An error occurred during signup');
    console.error('Signup error:', err);
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: #f4f4f4;
          color: black;
        }
        .container {
          max-width: 400px;
          margin: 100px auto;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h2 {
          text-align: center;
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 6px;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          background: white;
        }
        button {
          width: 100%;
          padding: 12px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 18px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        button:hover:not(:disabled) {
          background-color: #005bb5;
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .error {
          color: #d32f2f;
          background-color: #ffebee;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          border: 1px solid #f5c6cb;
        }
        .success {
          color: #2e7d32;
          background-color: #e8f5e9;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          border: 1px solid #c8e6c9;
        }
        .login-link {
          text-align: center;
          margin-top: 15px;
        }
        .login-link a {
          color: #0070f3;
          text-decoration: none;
        }
        .login-link a:hover {
          text-decoration: underline;
        }
        @media (max-width: 500px) {
          .container {
            margin: 50px 20px;
            padding: 15px;
          }
          input {
            font-size: 14px;
          }
          button {
            font-size: 16px;
          }
        }
      `}</style>

      <div className="container">
        <h2>Sign Up</h2>
        
        {error && (
          <div className="error">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={loading}
            minLength={2}
            maxLength={50}
          />

          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            disabled={loading}
            minLength={6}
            maxLength={100}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="/signin">Sign In</a>
        </div>
      </div>
    </>
  );
}