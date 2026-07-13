export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <div className="text-red-500 text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-white mb-2">Accès refusé</h1>
        <p className="text-slate-400">Vous n&apos;avez pas les permissions nécessaires.</p>
        <a href="/clients" className="mt-6 inline-block text-blue-400 hover:text-blue-300 underline">
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}
