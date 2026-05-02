import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { BarcodeScanningResult, BarcodeType, CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { Button } from './Button';
import { colors } from '../theme';

type BarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
};

const barcodeTypes: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e'];

export function BarcodeScannerModal({ visible, onClose, onScanned }: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);

  const handleScanned = (result: BarcodeScanningResult) => {
    if (locked) {
      return;
    }
    setLocked(true);
    onScanned(result.data);
  };

  const close = () => {
    setLocked(false);
    onClose();
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={close}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Scan barcode</Text>
            <Text style={styles.subtitle}>Point the camera at the UPC or EAN code.</Text>
          </View>
          <Button label="Close" variant="secondary" onPress={close} />
        </View>

        {!permission ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>Loading camera permissions...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.stateCard}>
            <Ionicons name="camera-outline" size={34} color={colors.accent} />
            <Text style={styles.stateTitle}>Camera access needed</Text>
            <Text style={styles.stateText}>Macro Streak uses the camera only to scan food barcodes.</Text>
            <Button label="Allow Camera" icon="camera-outline" onPress={() => void requestPermission()} />
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              barcodeScannerSettings={{ barcodeTypes }}
              facing="back"
              onBarcodeScanned={locked ? undefined : handleScanned}
              style={styles.camera}
            />
            <View style={styles.scanFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <View style={styles.footer}>
              <Text style={styles.footerText}>{locked ? 'Looking up food...' : 'Hold steady until the barcode is detected.'}</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const cornerBase = {
  borderColor: colors.accent,
  height: 34,
  position: 'absolute' as const,
  width: 34,
};

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  cameraWrap: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    marginTop: 18,
    overflow: 'hidden',
  },
  cornerBottomLeft: {
    ...cornerBase,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: 0,
    left: 0,
  },
  cornerBottomRight: {
    ...cornerBase,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: 0,
    right: 0,
  },
  cornerTopLeft: {
    ...cornerBase,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    left: 0,
    top: 0,
  },
  cornerTopRight: {
    ...cornerBase,
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: 0,
    top: 0,
  },
  footer: {
    backgroundColor: 'rgba(7, 8, 11, 0.82)',
    borderRadius: 12,
    bottom: 18,
    left: 18,
    padding: 12,
    position: 'absolute',
    right: 18,
  },
  footerText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  root: {
    backgroundColor: colors.background,
    flex: 1,
    padding: 18,
    paddingTop: 58,
  },
  scanFrame: {
    alignSelf: 'center',
    height: 170,
    left: '50%',
    marginLeft: -135,
    marginTop: -85,
    position: 'absolute',
    top: '50%',
    width: 270,
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 28,
    padding: 18,
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  stateTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
});
