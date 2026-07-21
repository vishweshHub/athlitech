import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, useThemeColors } from '@/styles/tokens';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';

interface SearchableDropdownProps {
  label: string;
  value: string;
  onSelect: (value: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  containerStyle?: any;
}

export default function SearchableDropdown({
  label,
  value,
  onSelect,
  options,
  placeholder = 'Select...',
  error,
  containerStyle,
}: SearchableDropdownProps) {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isFocusedValue = useSharedValue(0);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  function handleToggle() {
    setIsOpen(!isOpen);
    isFocusedValue.value = withTiming(!isOpen ? 1 : 0, { duration: 220 });
    if (isOpen) setSearch('');
  }

  function handleSelect(opt: string) {
    onSelect(opt);
    setIsOpen(false);
    setSearch('');
    isFocusedValue.value = withTiming(0, { duration: 220 });
  }

  const animatedStyle = useAnimatedStyle(() => {
    let borderColor, shadowColor, shadowOpacity;
    
    if (error) {
      borderColor = isFocusedValue.value === 1 ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.4)';
      shadowColor = colors.error;
      shadowOpacity = isFocusedValue.value === 1 ? 0.45 : 0;
    } else {
      borderColor = isFocusedValue.value === 1 ? colors.emerald : (colors.border || 'rgba(255,255,255,0.1)');
      shadowColor = colors.emerald;
      shadowOpacity = isFocusedValue.value === 1 ? 0.45 : 0;
    }

    return {
      borderColor: withTiming(borderColor, { duration: 220 }),
      backgroundColor: withTiming(colors.inputBg || 'rgba(255,255,255,0.04)', { duration: 400 }),
      shadowColor: withTiming(shadowColor, { duration: 220 }),
      shadowOpacity: withTiming(shadowOpacity, { duration: 220 }),
    };
  });

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSub }]}>{label}</Text>}

      <Pressable onPress={handleToggle}>
        <Animated.View
          style={[
            styles.inputRow,
            animatedStyle,
            {
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 12,
              elevation: 0,
            },
          ]}
        >
          <Text style={[styles.valueText, { color: value ? colors.textPrimary : colors.textMuted }]}>
            {value || placeholder}
          </Text>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={isOpen ? colors.emerald : colors.textMuted}
            style={styles.icon}
          />
        </Animated.View>
      </Pressable>

      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: colors.bgGlass, borderColor: colors.border }]}>
          <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
              // Remove browser default outline on web
              {...({ outlineWidth: 0, outlineStyle: 'none' } as any)}
            />
          </View>
          <ScrollView style={styles.list} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <Pressable
                  key={opt}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent' }
                  ]}
                  onPress={() => handleSelect(opt)}
                >
                  <Text style={[styles.optionText, { color: value === opt ? colors.emerald : colors.textPrimary }]}>
                    {opt}
                  </Text>
                  {value === opt && <Ionicons name="checkmark" size={18} color={colors.emerald} />}
                </Pressable>
              ))
            ) : (
              <Text style={[styles.noResult, { color: colors.textMuted }]}>No results found</Text>
            )}
          </ScrollView>
        </View>
      )}

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    minHeight: 52,
    overflow: 'hidden',
  },
  valueText: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: {
    paddingHorizontal: 16,
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    maxHeight: 220,
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  list: {
    maxHeight: 180,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 15,
  },
  noResult: {
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  error: {
    fontSize: 13,
    marginTop: 6,
    width: '100%',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
});
