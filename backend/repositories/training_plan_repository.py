from typing import List, Optional
from bson.objectid import ObjectId
from database import mongodb


class TrainingPlanRepository:
    def __init__(self):
        self._plans_collection = None
        self._weeks_collection = None
        self._days_collection = None

    @property
    def plans_collection(self):
        if self._plans_collection is not None:
            return self._plans_collection
        try:
            from routes import training_plan_routes
            if hasattr(training_plan_routes, "training_plans_collection"):
                return training_plan_routes.training_plans_collection
        except ImportError:
            pass
        return mongodb.training_plans_collection

    @plans_collection.setter
    def plans_collection(self, value):
        self._plans_collection = value

    @property
    def weeks_collection(self):
        if self._weeks_collection is not None:
            return self._weeks_collection
        try:
            from routes import training_plan_routes
            if hasattr(training_plan_routes, "training_weeks_collection"):
                return training_plan_routes.training_weeks_collection
        except ImportError:
            pass
        return mongodb.training_weeks_collection

    @weeks_collection.setter
    def weeks_collection(self, value):
        self._weeks_collection = value

    @property
    def days_collection(self):
        if self._days_collection is not None:
            return self._days_collection
        try:
            from routes import training_plan_routes
            if hasattr(training_plan_routes, "training_days_collection"):
                return training_plan_routes.training_days_collection
        except ImportError:
            pass
        return mongodb.training_days_collection

    @days_collection.setter
    def days_collection(self, value):
        self._days_collection = value

    # --- Training Plan Repository Methods ---

    async def create_plan(self, plan_data: dict) -> dict:
        doc = dict(plan_data)
        if "id" not in doc:
            doc["id"] = str(ObjectId())
        await self.plans_collection.insert_one(doc)
        return doc

    async def get_plans(self, skip: int = 0, limit: int = 100, query_filter: Optional[dict] = None) -> List[dict]:
        q = query_filter or {}
        plans = []
        cursor = self.plans_collection.find(q).skip(skip).limit(limit)
        async for p in cursor:
            plans.append(p)
        return plans

    async def find_plan_by_id(self, plan_id: str) -> Optional[dict]:
        plan = await self.plans_collection.find_one({"id": plan_id})
        if not plan and ObjectId.is_valid(plan_id):
            plan = await self.plans_collection.find_one({"_id": ObjectId(plan_id)})
        return plan

    async def update_plan(self, plan_id: str, changes: dict) -> Optional[dict]:
        result = await self.plans_collection.update_one(
            {"$or": [{"id": plan_id}, {"_id": ObjectId(plan_id)}] if ObjectId.is_valid(plan_id) else [{"id": plan_id}]},
            {"$set": changes}
        )
        if result.matched_count == 0:
            return None
        return await self.find_plan_by_id(plan_id)

    async def delete_plan(self, plan_id: str) -> bool:
        # Cascade delete weeks and days
        weeks = await self.get_weeks_by_plan(plan_id)
        for w in weeks:
            await self.delete_week(w["id"])

        res = await self.plans_collection.delete_one(
            {"$or": [{"id": plan_id}, {"_id": ObjectId(plan_id)}]} if ObjectId.is_valid(plan_id) else {"id": plan_id}
        )
        return res.deleted_count > 0

    # --- Training Week Repository Methods ---

    async def create_week(self, week_data: dict) -> dict:
        doc = dict(week_data)
        if "id" not in doc:
            doc["id"] = str(ObjectId())
        await self.weeks_collection.insert_one(doc)
        return doc

    async def get_weeks_by_plan(self, plan_id: str) -> List[dict]:
        weeks = []
        cursor = self.weeks_collection.find({"training_plan_id": plan_id}).sort("week_number", 1)
        async for w in cursor:
            weeks.append(w)
        return weeks

    async def find_week_by_id(self, week_id: str) -> Optional[dict]:
        week = await self.weeks_collection.find_one({"id": week_id})
        if not week and ObjectId.is_valid(week_id):
            week = await self.weeks_collection.find_one({"_id": ObjectId(week_id)})
        return week

    async def update_week(self, week_id: str, changes: dict) -> Optional[dict]:
        result = await self.weeks_collection.update_one(
            {"$or": [{"id": week_id}, {"_id": ObjectId(week_id)}]} if ObjectId.is_valid(week_id) else {"id": week_id},
            {"$set": changes}
        )
        if result.matched_count == 0:
            return None
        return await self.find_week_by_id(week_id)

    async def delete_week(self, week_id: str) -> bool:
        # Cascade delete days belonging to this week and their sessions
        days = await self.get_days_by_week(week_id)
        for d in days:
            await self.delete_day(d["id"])
        res = await self.weeks_collection.delete_one(
            {"$or": [{"id": week_id}, {"_id": ObjectId(week_id)}]} if ObjectId.is_valid(week_id) else {"id": week_id}
        )
        return res.deleted_count > 0

    # --- Training Day Repository Methods ---

    async def create_day(self, day_data: dict) -> dict:
        doc = dict(day_data)
        if "id" not in doc:
            doc["id"] = str(ObjectId())
        await self.days_collection.insert_one(doc)
        return doc

    async def get_days_by_week(self, week_id: str) -> List[dict]:
        days = []
        cursor = self.days_collection.find({"training_week_id": week_id})
        async for d in cursor:
            days.append(d)
        return days

    async def find_day_by_id(self, day_id: str) -> Optional[dict]:
        day = await self.days_collection.find_one({"id": day_id})
        if not day and ObjectId.is_valid(day_id):
            day = await self.days_collection.find_one({"_id": ObjectId(day_id)})
        return day

    async def update_day(self, day_id: str, changes: dict) -> Optional[dict]:
        result = await self.days_collection.update_one(
            {"$or": [{"id": day_id}, {"_id": ObjectId(day_id)}]} if ObjectId.is_valid(day_id) else {"id": day_id},
            {"$set": changes}
        )
        if result.matched_count == 0:
            return None
        return await self.find_day_by_id(day_id)

    async def delete_day(self, day_id: str) -> bool:
        from repositories.session_repository import session_repository
        await session_repository.delete_sessions_by_day(day_id)
        res = await self.days_collection.delete_one(
            {"$or": [{"id": day_id}, {"_id": ObjectId(day_id)}]} if ObjectId.is_valid(day_id) else {"id": day_id}
        )
        return res.deleted_count > 0



training_plan_repository = TrainingPlanRepository()
