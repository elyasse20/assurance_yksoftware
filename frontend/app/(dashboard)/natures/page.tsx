import SimpleList from '@/components/SimpleList';
import { List } from 'lucide-react';
export default function NaturesPage() {
  return <SimpleList title="Natures" endpoint="natures" icon={<List className="w-4 h-4 text-primary" />} />;
}
