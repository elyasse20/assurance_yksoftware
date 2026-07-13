import SimpleList from '@/components/SimpleList';
import { Percent } from 'lucide-react';
export default function TvaPage() {
  return (
    <SimpleList
      title="TVA"
      endpoint="tva"
      icon={<Percent className="w-4 h-4 text-primary" />}
      extraFields={[{ key: 'rate', label: 'Taux (%)', type: 'number' }]}
    />
  );
}
