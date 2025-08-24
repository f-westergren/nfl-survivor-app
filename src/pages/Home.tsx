import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl">Home Page</h1>
      <div className="p-2">
        <Link to="/login" className="text-blue-500">
          Go to Login
        </Link>
      </div>
      <div className="p-2">
        <Link to="/signup" className="text-blue-500">
          Sign up
        </Link>
      </div>
    </div>
  );
}
