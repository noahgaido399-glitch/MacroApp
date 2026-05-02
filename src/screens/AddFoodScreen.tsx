import { Alert } from 'react-native';

import { Card } from '../components/Card';
import { MacroForm, parseMacroForm } from '../components/MacroForm';
import { Screen } from '../components/Screen';
import { useAppData } from '../state/AppDataContext';
import { toDateKey } from '../utils/dates';

type AddFoodScreenProps = {
  onSaved: () => void;
};

function makeId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AddFoodScreen({ onSaved }: AddFoodScreenProps) {
  const { saveEntry } = useAppData();

  return (
    <Screen title="Add Food" subtitle="Log a food item for today.">
      <Card>
        <MacroForm
          submitLabel="Log Food"
          onSubmit={async (values) => {
            const parsed = parseMacroForm(values);
            if (!parsed) {
              return;
            }
            await saveEntry({
              id: makeId(),
              date: toDateKey(),
              ...parsed,
              createdAt: new Date().toISOString(),
            });
            Alert.alert('Logged', `${parsed.name} was added to today.`);
            onSaved();
          }}
        />
      </Card>
    </Screen>
  );
}
