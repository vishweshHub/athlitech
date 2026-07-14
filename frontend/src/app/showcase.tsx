import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Platform, SafeAreaView } from 'react-native';
import { useThemeColors } from '@/styles/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  Button,
  Input,
  Card,
  Badge,
  StatCard,
  SearchBar,
  Table,
  EmptyState,
  SkeletonLoader,
  ThemeToggle,
} from '@/components/ui';

export default function ShowcaseScreen() {
  const colors = useThemeColors();
  const scheme = useColorScheme();

  const [inputText, setInputText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [errorText, setErrorText] = useState('');

  const tableHeaders = ['ID', 'Athlete Name', 'Status', 'Performance'];
  const tableData = [
    { id: 'ATH-109', name: 'Marcus Vance', status: 'Active', performance: '92.4%' },
    { id: 'ATH-210', name: 'Serena Davis', status: 'Injured', performance: '87.1%' },
    { id: 'ATH-305', name: 'Kaelen Miller', status: 'Pending', performance: 'N/A' },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Background gradients for premium aesthetic */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: scheme === 'dark' 
              ? 'radial-gradient(ellipse 80% 55% at 30% -10%, rgba(16,185,129,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 80% 100%, rgba(14,165,233,0.05) 0%, transparent 60%), linear-gradient(160deg, #060b14 0%, #0a0f1a 55%, #0d1525 100%)'
              : 'radial-gradient(ellipse 80% 55% at 30% -10%, rgba(16,185,129,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 80% 100%, rgba(14,165,233,0.03) 0%, transparent 60%), #f8fafc',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>AthliTech UI Components</Text>
            <Text style={[styles.subtitle, { color: colors.textSub }]}>
              Showcasing 10 reusable UI library elements in {scheme.toUpperCase()} theme.
            </Text>
          </View>
          <ThemeToggle />
        </View>

        {/* 1. Theme Scheme Indicator & Badges */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>1. Badges & Indicators</Text>
          <View style={styles.badgeRow}>
            <Badge label="Success" variant="success" />
            <Badge label="Warning" variant="warning" />
            <Badge label="Error" variant="error" />
            <Badge label="Info" variant="info" />
            <Badge label="Neutral" variant="neutral" />
          </View>
        </Card>

        {/* 2. Buttons */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>2. Buttons</Text>
          <View style={styles.row}>
            <Button label="Primary Button" onPress={() => {}} variant="primary" />
            <Button label="Secondary" onPress={() => {}} variant="secondary" />
            <Button label="Danger" onPress={() => {}} variant="danger" />
            <Button label="Ghost" onPress={() => {}} variant="ghost" />
          </View>

          <Text style={[styles.subSectionTitle, { color: colors.textSub }]}>Sizes & States</Text>
          <View style={styles.row}>
            <Button label="Small" onPress={() => {}} size="sm" />
            <Button label="Medium" onPress={() => {}} size="md" />
            <Button label="Large" onPress={() => {}} size="lg" />
            <Button label="Loading" onPress={() => {}} loading />
            <Button label="Disabled" onPress={() => {}} disabled />
          </View>
        </Card>

        {/* 3. Inputs & Search */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>3. Text Inputs & SearchBar</Text>
          <View style={styles.inputContainer}>
            <Input
              label="Standard Text Input"
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type something..."
            />
            
            <Input
              label="Password Input"
              value="secret123"
              password
              placeholder="Enter password"
            />

            <Input
              label="Input with Error Validation"
              value={errorText}
              onChangeText={(t) => {
                setErrorText(t);
              }}
              error={errorText.length < 5 ? 'Must be at least 5 characters.' : undefined}
              placeholder="Verify text error state..."
            />

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.subLabel, { color: colors.textSub }]}>Search Bar Filter</Text>
              <SearchBar
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search athletes, coaches, plans..."
              />
            </View>
          </View>
        </Card>

        {/* 4. StatCards */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Total Athletes"
            value={10500}
            suffix="+"
            trend="+12%"
            trendDirection="up"
            delay={0}
          />
          <StatCard
            label="Active Coaches"
            value={480}
            trend="+8%"
            trendDirection="up"
            delay={100}
          />
          <StatCard
            label="Injury Incidents"
            value={3}
            trend="-15%"
            trendDirection="down"
            delay={200}
          />
        </View>

        {/* 5. Responsive Data Table */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>5. Responsive Data Table</Text>
          <Table
            headers={tableHeaders}
            data={tableData}
            renderRow={(item: any, index: number) => (
              <React.Fragment key={index}>
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: colors.textPrimary }]}>{item.id}</Text>
                </View>
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: colors.textPrimary, fontWeight: '600' }]}>{item.name}</Text>
                </View>
                <View style={styles.cell}>
                  <Badge
                    label={item.status}
                    variant={
                      item.status === 'Active'
                        ? 'success'
                        : item.status === 'Injured'
                        ? 'error'
                        : 'warning'
                    }
                  />
                </View>
                <View style={styles.cell}>
                  <Text style={[styles.cellText, { color: colors.emerald, fontWeight: '700' }]}>{item.performance}</Text>
                </View>
              </React.Fragment>
            )}
          />
        </Card>

        {/* 6. Empty States */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>6. Empty State Frame</Text>
          <EmptyState
            icon="barbell-outline"
            title="No Workouts Scheduled"
            description="There are currently no active workouts scheduled for this team. Click below to template a new plan."
            actionLabel="Schedule Workout"
            onActionPress={() => alert('Empty state button clicked')}
          />
        </Card>

        {/* 7. Skeleton Loaders */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>7. Skeleton Loaders</Text>
          <View style={styles.skeletonContainer}>
            <View style={styles.skeletonHeaderRow}>
              <SkeletonLoader variant="circle" width={50} height={50} />
              <View style={styles.skeletonHeaderText}>
                <SkeletonLoader variant="text" width="60%" height={16} />
                <SkeletonLoader variant="text" width="40%" height={12} style={{ marginTop: 6 }} />
              </View>
            </View>
            <SkeletonLoader variant="rect" width="100%" height={110} style={{ marginTop: 16 }} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    padding: 24,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionCard: {
    padding: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inputContainer: {
    gap: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  cell: {
    paddingHorizontal: 16,
    minWidth: 140,
    flex: 1,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
  },
  skeletonContainer: {
    width: '100%',
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonHeaderText: {
    flex: 1,
    marginLeft: 14,
  },
});
