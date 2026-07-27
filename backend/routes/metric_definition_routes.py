from fastapi import APIRouter, Depends
from typing import List

from services.auth_service import get_current_user
from schemas.metric_definition_schema import (
    MetricDefinitionCreate,
    MetricDefinitionResponse,
)
from services.metric_definition_service import (
    create_metric_definition,
    get_all_metric_definitions,
)

router = APIRouter(prefix="/metric-definitions", tags=["Metric Definitions"])


@router.get("", response_model=List[MetricDefinitionResponse], summary="Get All Metric Definitions")
@router.get("/", response_model=List[MetricDefinitionResponse], summary="Get All Metric Definitions")
async def get_metric_definitions_route(
    current_user: dict = Depends(get_current_user),
):
    return await get_all_metric_definitions()


@router.post("", response_model=MetricDefinitionResponse, summary="Create Metric Definition (Admin Only)")
@router.post("/", response_model=MetricDefinitionResponse, summary="Create Metric Definition (Admin Only)")
async def create_metric_definition_route(
    payload: MetricDefinitionCreate,
    current_user: dict = Depends(get_current_user),
):
    return await create_metric_definition(payload, current_user)
