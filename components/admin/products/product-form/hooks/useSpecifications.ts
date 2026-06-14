import { useState } from 'react';

export interface Spec {
  id: string;
  key: string;
  value: string;
}

export function useSpecifications(initialSpecs: Spec[] = [{ id: '1', key: '', value: '' }]) {
  const [specs, setSpecs] = useState<Spec[]>(initialSpecs);

  const addSpec = () => {
    setSpecs([...specs, { id: Math.random().toString(36).substr(2, 9), key: '', value: '' }]);
  };

  const removeSpec = (id: string) => {
    setSpecs(specs.filter(s => s.id !== id));
  };

  const updateSpec = (id: string, field: 'key' | 'value', value: string) => {
    setSpecs(specs.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const loadTemplate = (keys: string[]) => {
    const currentKeys = new Set(specs.map(s => s.key));
    const newSpecs = [...specs];
    
    keys.forEach(key => {
        if (!currentKeys.has(key)) {
            newSpecs.push({ id: Math.random().toString(36).substr(2, 9), key: key, value: '' });
        }
    });
    
    if (newSpecs.length > 1 && newSpecs[0].key === '' && newSpecs[0].value === '') {
       const filtered = newSpecs.filter(s => s.key !== '' || s.value !== '');
       if (filtered.length > 0) setSpecs(filtered);
       else setSpecs(newSpecs);
    } else {
       setSpecs(newSpecs);
    }
  };

  return {
    specs,
    setSpecs,
    addSpec,
    removeSpec,
    updateSpec,
    loadTemplate
  };
}
