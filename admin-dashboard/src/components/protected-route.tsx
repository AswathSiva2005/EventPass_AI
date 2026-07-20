import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth";

export const ProtectedRoute = ({children}:{children:React.ReactNode}) => {
  const {user,loading}=useAuth();
  if(loading)return <div className="grid min-h-screen place-items-center"><div className="size-9 animate-spin rounded-full border-3 border-slate-200 border-t-lime-400"/></div>;
  return user?<>{children}</>:<Navigate to="/login" replace/>;
};
