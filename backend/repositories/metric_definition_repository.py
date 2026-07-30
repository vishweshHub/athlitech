from typing import List, Optional
from bson.objectid import ObjectId
from database import mongodb


class MetricDefinitionRepository:
    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is not None:
            return self._collection
        try:
            from routes import metric_definition_routes
            if hasattr(metric_definition_routes, "metric_definitions_collection"):
                return metric_definition_routes.metric_definitions_collection
        except ImportError:
            pass
        return mongodb.metric_definitions_collection

    @collection.setter
    def collection(self, value):
        self._collection = value

    async def create_metric_definition(self, doc: dict) -> dict:
        data = dict(doc)
        if "id" not in data:
            data["id"] = str(ObjectId())
        await self.collection.insert_one(data)
        return data

    async def get_all_metric_definitions(self) -> List[dict]:
        metrics = []
        cursor = self.collection.find()
        async for m in cursor:
            metrics.append(m)
        return metrics

    async def find_metric_definition_by_key(self, metric_key: str) -> Optional[dict]:
        return await self.collection.find_one({"metric_key": metric_key})

    async def find_metric_definition_by_id(self, metric_id: str) -> Optional[dict]:
        m = await self.collection.find_one({"id": metric_id})
        if not m and ObjectId.is_valid(metric_id):
            m = await self.collection.find_one({"_id": ObjectId(metric_id)})
        return m


metric_definition_repository = MetricDefinitionRepository()
