from typing import List, Dict, Any

class RecommendationEngine:
    """
    Rule-based recommendation engine for personalized workout recommendations
    based on Athlete Sport + Event.
    Easily pluggable/replaceable by AI models in future modules.
    """

    @staticmethod
    def get_recommendations(sport: str, event: str) -> List[Dict[str, Any]]:
        s_clean = sport.strip().lower()
        e_clean = event.strip().lower()

        # Athletics / Track & Field Rules
        if "athletics" in s_clean or "track" in s_clean or "running" in s_clean:
            if "100m" in e_clean or "200m" in e_clean or "sprint" in e_clean:
                return [
                    {
                        "title": "Sprint Starts & Reaction Drill",
                        "category": "Speed & Explosiveness",
                        "description": "Block start drills and 10m reaction acceleration sprints.",
                        "tags": ["Explosive", "Starts", "Speed"],
                    },
                    {
                        "title": "Drive Phase Acceleration",
                        "category": "Speed Endurance",
                        "description": "30m sled pushes followed by 40m unresisted accelerations.",
                        "tags": ["Acceleration", "Power"],
                    },
                    {
                        "title": "Sprint Mechanics & Max Velocity",
                        "category": "Technique",
                        "description": "High knees, butt kicks, and 60m flying sprints focusing on stride frequency.",
                        "tags": ["Form", "Max Velocity"],
                    },
                    {
                        "title": "Lower Body Plyometrics",
                        "category": "Strength",
                        "description": "Depth jumps, bounding, and single-leg box jumps for ground contact force.",
                        "tags": ["Plyometrics", "Power"],
                    },
                ]
            elif "400m" in e_clean or "800m" in e_clean or "middle" in e_clean:
                return [
                    {
                        "title": "Lactic Tolerance Intervals",
                        "category": "Speed Endurance",
                        "description": "3x 300m reps at 90% velocity with 5-min recovery.",
                        "tags": ["Endurance", "Tolerance"],
                    },
                    {
                        "title": "Tempo Pace Runs",
                        "category": "Aerobic Capacity",
                        "description": "20-minute aerobic threshold tempo runs with controlled breathing.",
                        "tags": ["Tempo", "Capacity"],
                    },
                    {
                        "title": "Core & Pelvic Stability",
                        "category": "Conditioning",
                        "description": "Planks, deadbugs, and paloff presses for posture under fatigue.",
                        "tags": ["Core", "Stability"],
                    },
                ]
            elif "marathon" in e_clean or "long" in e_clean or "5k" in e_clean or "10k" in e_clean:
                return [
                    {
                        "title": "Long Slow Distance (LSD)",
                        "category": "Endurance",
                        "description": "Zone 2 base building run focusing on continuous steady state.",
                        "tags": ["Base", "Stamina"],
                    },
                    {
                        "title": "VO2 Max Hill Repeats",
                        "category": "Capacity",
                        "description": "8x 2-minute incline hill sprints with jog-down recovery.",
                        "tags": ["Hills", "VO2Max"],
                    },
                ]

        # Swimming Rules
        if "swim" in s_clean:
            return [
                {
                    "title": "Stroke Rate & Catch Drills",
                    "category": "Technique",
                    "description": "Fist swimming and sculling drills to build feel for the water.",
                    "tags": ["Hydrodynamics", "Catch"],
                },
                {
                    "title": "Threshold Intervals",
                    "category": "Endurance",
                    "description": "10x 100m on strict interval pace.",
                    "tags": ["Intervals", "Pace"],
                },
                {
                    "title": "Lat & Shoulder Mobility Core Work",
                    "category": "Dryland",
                    "description": "Band pull-aparts, Y-T-Ws, and swimmer planks.",
                    "tags": ["Dryland", "Shoulders"],
                },
            ]

        # Basketball / Football / Soccer / Team Sports
        if any(ts in s_clean for ts in ["basketball", "football", "soccer", "rugby", "volleyball"]):
            return [
                {
                    "title": "Agility Ladder & Cone Cuts",
                    "category": "Agility",
                    "description": "Multi-directional change-of-direction cuts and lateral shuffles.",
                    "tags": ["Agility", "COD"],
                },
                {
                    "title": "Repeated Sprint Ability (RSA)",
                    "category": "Conditioning",
                    "description": "10x 20m shuttle sprints with 20s rest interval.",
                    "tags": ["Shuttle", "Conditioning"],
                },
                {
                    "title": "Vertical Jump & Landing Mechanics",
                    "category": "Plyometrics",
                    "description": "Countermovement jumps and deceleration landing drills to prevent knee injuries.",
                    "tags": ["Jump", "Deceleration"],
                },
            ]

        # General Default Fallback Recommendation
        return [
            {
                "title": "Foundational Athletic Movement",
                "category": "General Athletics",
                "description": "Dynamic warmup, mobility routine, and bodyweight movement patterns.",
                "tags": ["Foundation", "Mobility"],
            },
            {
                "title": "Core & Kinetic Chain Strength",
                "category": "Strength",
                "description": "Compound bodyweight holds, rotational core, and posterior chain activations.",
                "tags": ["Core", "Posture"],
            },
            {
                "title": "Anaerobic Interval Conditioning",
                "category": "Conditioning",
                "description": "High intensity interval training (HIIT) protocol 30s work / 30s rest.",
                "tags": ["HIIT", "Cardio"],
            },
        ]


recommendation_engine = RecommendationEngine()
