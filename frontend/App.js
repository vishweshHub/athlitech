import { Text, View, ScrollView } from "react-native";
import { useEffect, useState } from "react";

export default function App() {
  const [athletes, setAthletes] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://172.20.238.219:3000/athletes")
      .then((res) => res.json())
      .then((data) => setAthletes(data))
      .catch((err) => {
        console.log(err);
        setError("Failed to load athletes");
      });
  }, []);

  return (
    <ScrollView style={{ padding: 40 }}>
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

