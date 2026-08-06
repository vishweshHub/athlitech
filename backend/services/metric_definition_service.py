import uuid
from datetime import datetime
from typing import List
from fastapi import HTTPException

from core.permissions import normalize_role
from core.utils import get_utc_now
from core.constants import ROLE_ADMIN
from repositories.metric_definition_repository import metric_definition_repository
from schemas.metric_definition_schema import (
    MetricDefinitionCreate,
    MetricDefinitionResponse,
)


def _format_metric_definition_response(m: dict) -> MetricDefinitionResponse:
    m_id = str(m.get("id") or m.get("_id"))
    return MetricDefinitionResponse(
        id=m_id,
        metric_key=str(m.get("metric_key", "")),
        display_name=str(m.get("display_name", "")),
        unit=str(m.get("unit", "")),
        data_type=str(m.get("data_type", "float")),
        better_direction=str(m.get("better_direction", "higher")),
        sport=m.get("sport"),
        created_at=m.get("created_at") if isinstance(m.get("created_at"), datetime) else get_utc_now(),
        updated_at=m.get("updated_at") if isinstance(m.get("updated_at"), datetime) else get_utc_now(),
    )


async def create_metric_definition(
    payload: MetricDefinitionCreate, current_user: dict
) -> MetricDefinitionResponse:
    role = normalize_role(current_user.get("role"))
    if role != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Metric Definition creation is Admin only")

    existing = await metric_definition_repository.find_metric_definition_by_key(payload.metric_key)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Metric definition with key '{payload.metric_key}' already exists"
        )

    now = get_utc_now()
    doc = {
        "id": str(uuid.uuid4()),
        "metric_key": payload.metric_key,
        "display_name": payload.display_name,
        "unit": payload.unit,
        "data_type": payload.data_type or "float",
        "better_direction": payload.better_direction.value if hasattr(payload.better_direction, "value") else payload.better_direction,
        "sport": payload.sport,
        "created_at": now,
        "updated_at": now,
    }

    created = await metric_definition_repository.create_metric_definition(doc)
    return _format_metric_definition_response(created)



async def get_all_metric_definitions() -> List[MetricDefinitionResponse]:
    metrics = await metric_definition_repository.get_all_metric_definitions()
    return [_format_metric_definition_response(m) for m in metrics]
