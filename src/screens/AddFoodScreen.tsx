import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MacroForm, MacroFormValues, parseMacroForm } from '../components/MacroForm';
import { Screen } from '../components/Screen';
import { lookupFoodByBarcode } from '../services/foodLookup';
import { useAppData } from '../state/AppDataContext';
import { colors } from '../theme';
import { toDateKey } from '../utils/dates';

type AddFoodScreenProps = {
  onSaved: () => void;
};

function makeId() {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AddFoodScreen({ onSaved }: AddFoodScreenProps) {
  const { saveEntry } = useAppData();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [lookupValues, setLookupValues] = useState<MacroFormValues | undefined>();
  const [lookupStatus, setLookupStatus] = useState('');
  const formKey = useMemo(() => JSON.stringify(lookupValues ?? 'manual'), [lookupValues]);

  const logFood = async (values: MacroFormValues) => {
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
    setLookupValues(undefined);
    setLookupStatus('');
    onSaved();
  };

  const handleScanned = async (barcode: string) => {
    setScannerVisible(false);
    setLookupStatus(`Looking up ${barcode}...`);
    try {
      const result = await lookupFoodByBarcode(barcode);
      setLookupValues(result.values);
      setLookupStatus(`Found through ${result.source}. Review serving/macros before logging.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Barcode lookup failed.';
      setLookupValues(undefined);
      setLookupStatus('');
      Alert.alert('Food not found', `${message}\n\nYou can still enter the food manually.`);
    }
  };

  return (
    <Screen title="Add Food" subtitle="Log a food item for today.">
      <View style={styles.scanRow}>
        <Button icon="scan-outline" label="Scan Barcode" onPress={() => setScannerVisible(true)} />
      </View>
      {lookupStatus ? (
        <Card>
          <Text style={styles.lookupText}>{lookupStatus}</Text>
        </Card>
      ) : null}
      <Card>
        <MacroForm
          key={formKey}
          initialValues={lookupValues}
          submitLabel="Log Food"
          onSubmit={(values) => void logFood(values)}
        />
      </Card>
      <BarcodeScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanned={(barcode) => void handleScanned(barcode)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lookupText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  scanRow: {
    gap: 10,
  },
});
