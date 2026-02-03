import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  autoComplete = 'off',
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text) => {
    if (keyboardType === 'numeric' || keyboardType === 'decimal-pad') {
      text = text.replace(',', '.');
    }
    onChangeText(text);
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>
      )}
      <TextInput
        style={[styles.input, isFocused && styles.inputFocused]}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        keyboardType={keyboardType === 'numeric' ? 'decimal-pad' : keyboardType}
        placeholderTextColor={colors.textLight}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Montserrat_500Medium',
    color: colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  labelFocused: {
    color: colors.primary,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Montserrat_400Regular',
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: '#EDE8F0',
    shadowColor: '#D5CDE0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 1,
  },
  inputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
  },
});
