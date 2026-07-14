import { redirect } from 'next/navigation';

/** Redirect root → /dashboard */
export default function HomePage() {
  redirect('/dashboard');
}
