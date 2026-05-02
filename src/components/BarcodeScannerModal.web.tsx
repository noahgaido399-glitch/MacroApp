import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

import { Button } from './Button';
import { colors } from '../theme';

type BarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
};

export function BarcodeScannerModal({ visible, onClose, onScanned }: BarcodeScannerModalProps) {
  const videoId = 'macro-streak-zxing-video';
  const controlsRef = useRef<IScannerControls | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!visible) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      setLocked(false);
      return;
    }

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoId, (result) => {
        const text = result?.getText();
        if (!text || locked || cancelled) {
          return;
        }
        setLocked(true);
        controlsRef.current?.stop();
        onScanned(text);
      })
      .then((controls) => {
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch((error) => {
        Alert.alert('Scanner issue', error instanceof Error ? error.message : 'Could not start the camera scanner.');
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [locked, onScanned, visible]);

  const close = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setLocked(false);
    onClose();
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={close}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Scan barcode</Text>
            <Text style={styles.subtitle}>Browser scanner powered by ZXing.</Text>
          </View>
          <Button label="Close" variant="secondary" onPress={close} />
        </View>
        <View style={styles.cameraWrap}>
          <video id={videoId} style={styles.video} playsInline muted />
          <View style={styles.footer}>
            <Text style={styles.footerText}>{locked ? 'Looking up food...' : 'Center the barcode and hold steady.'}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    marginTop: 18,
    overflow: 'hidden',
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
  video: {
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
});
