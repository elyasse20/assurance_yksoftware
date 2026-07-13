import { redirect } from 'next/navigation';

/** Redirect root → /clients (equivalent of <Navigate to="/clients" replace /> in App.jsx) */
export default function HomePage() {
  redirect('/clients');
}
