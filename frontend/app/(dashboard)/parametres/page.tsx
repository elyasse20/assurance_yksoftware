import SimpleList from '@/components/SimpleList';
import { Settings } from 'lucide-react';
export default function ParametresPage() {
  return <SimpleList title="Paramètres" endpoint="parametres" icon={<Settings className="w-4 h-4 text-primary" />} />;
}
