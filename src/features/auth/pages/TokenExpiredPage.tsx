import { Link } from "react-router-dom";

export default function TokenExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-6 text-center space-y-4">

        <h1 className="text-2xl font-bold text-red-600">Enlace no válido</h1>

        <p className="text-gray-600">
          El enlace para restablecer tu contraseña ha expirado o ya fue usado.
        </p>

        <p className="text-gray-600">
          Puedes solicitar uno nuevo haciendo clic aquí:
        </p>

        <Link
          to="/forgot-password"
          className="block bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Solicitar nuevo enlace
        </Link>

        <Link
          to="/login"
          className="block text-gray-500 underline mt-3"
        >
          Volver al login
        </Link>

      </div>
    </div>
  );
}
