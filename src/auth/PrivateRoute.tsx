import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

interface PrivateRouteProps {
  children: JSX.Element;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}
