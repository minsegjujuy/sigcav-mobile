import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Ajustá imports
import { HechoVialListDto } from '../../features/hechos-viales/types';
import { generarTextoHechoVial } from '../../features/hechos-viales/generarTextoHechoVial';

interface Props {
  hechoVial: HechoVialListDto;
}

export const BotonCopiarHechoVial = ({ hechoVial }: Props) => {
  const handleCopy = async () => {
    try {
      const texto = generarTextoHechoVial(hechoVial);

      await Clipboard.setStringAsync(texto);

      Alert.alert('Copiado', 'Informe copiado al portapapeles');
    } catch (error) {
      console.error('Error copiando texto', error);
      Alert.alert('Error', 'No se pudo copiar el informe');
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleCopy}>
      {/* Podés meter un icono acá si querés */}
      <Text style={styles.buttonText}>📋 Copiar Informe</Text>
    </TouchableOpacity>
  );
};

export default BotonCopiarHechoVial;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});