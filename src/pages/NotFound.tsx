import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BackButton } from "@/components/BackButton";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <BackButton className="mb-6" />
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Página não encontrada</p>
        <p className="text-sm text-gray-500">
          A página que você está procurando não existe.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
