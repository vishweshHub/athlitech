import { Text, ScrollView } from "react-native";
import { useEffect, useState } from "react";

type Athlete = {
  id: number;
  name: string;
  sport: string;
  bestTime: number;
};

export default function HomeScreen() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://172.20.238.219:3000/athletes")
      .then((res) => res.json())
      .then((data) => setAthletes(data))
      .catch(() => setError("Failed to load athletes"));
  }, []);

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        AthliTech Athletes
      </Text>

      {error && <Text style={{ color: "red" }}>{error}</Text>}

      {athletes.map((a) => (
        <Text key={a.id} style={{ marginBottom: 10 }}>
          {a.name} — {a.sport} ({a.bestTime})
        </Text>
      ))}
    </ScrollView>
  );
}

