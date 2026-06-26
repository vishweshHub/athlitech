from database.mongodb import athletes_collection


async def register_athlete(athlete):
    await athletes_collection.insert_one({
        "name": athlete.name,
        "sport": athlete.sport,
        "weight": athlete.weight
    })

    return {"message": "Athlete Registered Successfully"}


async def get_all_athletes():
    athletes = []

    async for athlete in athletes_collection.find():
        athletes.append({
            "name": athlete["name"],
            "sport": athlete["sport"],
            "weight": athlete.get("weight", "Not Provided")
        })

    return athletes


async def update_weight(name: str, weight: int):
    result = await athletes_collection.update_one(
        {"name": name},
        {"$set": {"weight": weight}}
    )

    return {
        "matched": result.matched_count,
        "modified": result.modified_count
    }


async def delete_all():
    result = await athletes_collection.delete_many({})

    return {
        "message": f"Deleted {result.deleted_count} athletes"
    }