'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SimpleList from '@/components/SimpleList';
import { Tag, List, Settings, Percent, Database } from 'lucide-react';

export default function ReferentielsPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion des Référentiels</h1>
          <p className="text-sm text-muted-foreground">
            Centralisation des tables de configuration (Catégories, Natures, Paramètres & TVA)
          </p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="categories">
            <Tag className="w-4 h-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="natures">
            <List className="w-4 h-4" />
            Natures
          </TabsTrigger>
          <TabsTrigger value="parametres">
            <Settings className="w-4 h-4" />
            Paramètres Tarification
          </TabsTrigger>
          <TabsTrigger value="tva">
            <Percent className="w-4 h-4" />
            TVA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <SimpleList
            title="Catégories"
            itemLabel="catégorie"
            endpoint="categories"
            icon={<Tag className="w-4 h-4 text-primary" />}
            extraFields={[
              { key: 'commissionRate', label: 'Taux Commission (%)', type: 'number' }
            ]}
          />
        </TabsContent>

        <TabsContent value="natures">
          <SimpleList
            title="Natures"
            itemLabel="nature"
            endpoint="natures"
            icon={<List className="w-4 h-4 text-primary" />}
          />
        </TabsContent>

        <TabsContent value="parametres">
          <SimpleList
            title="Paramètres Tarification"
            itemLabel="paramètre"
            endpoint="parametres"
            icon={<Settings className="w-4 h-4 text-primary" />}
            fixedPayload={{ type: 'NUMBER' }}
            extraFields={[
              { key: 'value', label: 'Valeur (DH)', type: 'text' }
            ]}
          />
        </TabsContent>

        <TabsContent value="tva">
          <SimpleList
            title="TVA"
            itemLabel="TVA"
            endpoint="tva"
            icon={<Percent className="w-4 h-4 text-primary" />}
            extraFields={[
              { key: 'rate', label: 'Taux (%)', type: 'number' }
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
