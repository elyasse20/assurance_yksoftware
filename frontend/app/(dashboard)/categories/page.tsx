import SimpleList from '@/components/SimpleList';
import { Tag } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <SimpleList
      title="Catégories"
      endpoint="categories"
      icon={<Tag className="w-4 h-4 text-primary" />}
      extraFields={[
        { key: 'commissionRate', label: 'Taux Commission (%)', type: 'number' }
      ]}
    />
  );
}
