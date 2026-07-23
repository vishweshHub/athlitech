import pytest
from services.recommendation_service import recommendation_engine
from schemas.profile_schema import CompleteAthleteProfileRequest, CompleteCoachProfileRequest


def test_recommendation_engine_athletics_100m():
    recs = recommendation_engine.get_recommendations("Athletics", "100m")
    assert len(recs) == 4
    titles = [r["title"] for r in recs]
    assert "Sprint Starts & Reaction Drill" in titles
    assert "Drive Phase Acceleration" in titles


def test_recommendation_engine_swimming():
    recs = recommendation_engine.get_recommendations("Swimming", "100m Freestyle")
    assert len(recs) == 3
    titles = [r["title"] for r in recs]
    assert "Stroke Rate & Catch Drills" in titles


def test_recommendation_engine_basketball():
    recs = recommendation_engine.get_recommendations("Basketball", "Point Guard")
    assert len(recs) == 3
    titles = [r["title"] for r in recs]
    assert "Agility Ladder & Cone Cuts" in titles


def test_athlete_profile_schema_validation():
    req = CompleteAthleteProfileRequest(
        sport="Athletics",
        event="100m",
        height=180.5,
        weight=75.0,
        primary_goal="Sub 10.5s",
        goal_timeline="6 Months"
    )
    assert req.sport == "Athletics"
    assert req.event == "100m"
    assert req.height == 180.5


def test_coach_profile_schema_validation():
    req = CompleteCoachProfileRequest(
        primary_sport="Track & Field",
        specialization="Sprint & Velocity Mechanics",
        years_experience=10,
        bio="Ex-national sprinter turned speed coach."
    )
    assert req.primary_sport == "Track & Field"
    assert req.years_experience == 10
    assert "Ex-national" in req.bio
