from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import List

from app.database import supabase
from app.models.child_profile import ProfileCreate, ProfileUpdate, ProfileResponse, AdditionalDetails

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def normalize_additional_details(data):
    """Normalize additional_details to handle both old string format and new structured format."""
    if data is None:
        return AdditionalDetails().model_dump()
    if isinstance(data, str):
        # Legacy string format - wrap in notes field
        return AdditionalDetails(notes=data).model_dump()
    if isinstance(data, dict):
        return data
    return AdditionalDetails().model_dump()


def row_to_response(row: dict) -> ProfileResponse:
    additional_details = normalize_additional_details(row.get("additional_details"))
    return ProfileResponse(
        id=str(row["id"]),
        name=row.get("name", "Unknown"),
        age=int(row.get("age", 18)),
        sensitivities=row.get("sensitivities", {}),
        calming_strategy=row.get("calming_strategy", ""),
        additional_details=additional_details,
        created_at=str(row.get("created_at", "")),
        updated_at=str(row.get("updated_at", "")),
    )


@router.post("", response_model=ProfileResponse, status_code=201)
async def create_profile(profile: ProfileCreate):
    now = datetime.now(timezone.utc).isoformat()
    
    # Handle additional_details - convert to dict if it's a model
    additional_details = profile.additional_details
    if hasattr(additional_details, 'model_dump'):
        additional_details = additional_details.model_dump()
    elif isinstance(additional_details, str):
        additional_details = AdditionalDetails(notes=additional_details).model_dump()
    
    row = {
        "name": profile.name,
        "age": profile.age,
        "sensitivities": profile.sensitivities.model_dump(),
        "calming_strategy": profile.calming_strategy,
        "additional_details": additional_details,
        "created_at": now,
        "updated_at": now,
    }
    result = supabase.table("profiles").insert(row).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create profile - no data returned")
    return row_to_response(result.data[0])


@router.get("", response_model=List[ProfileResponse])
async def list_profiles():
    result = supabase.table("profiles").select("*").order("created_at", desc=True).execute()
    return [row_to_response(row) for row in result.data]


@router.get("/{profile_id}", response_model=ProfileResponse)
async def get_profile(profile_id: str):
    result = supabase.table("profiles").select("*").eq("id", profile_id).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    return row_to_response(result.data[0])


@router.put("/{profile_id}", response_model=ProfileResponse)
async def update_profile(profile_id: str, update: ProfileUpdate):
    update_data = update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "sensitivities" in update_data and update_data["sensitivities"] is not None:
        update_data["sensitivities"] = (
            update_data["sensitivities"]
            if isinstance(update_data["sensitivities"], dict)
            else update.sensitivities.model_dump()
        )
    
    # Handle additional_details - normalize to dict
    if "additional_details" in update_data and update_data["additional_details"] is not None:
        ad = update_data["additional_details"]
        if hasattr(ad, 'model_dump'):
            update_data["additional_details"] = ad.model_dump()
        elif isinstance(ad, str):
            update_data["additional_details"] = AdditionalDetails(notes=ad).model_dump()

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    result = supabase.table("profiles").update(update_data).eq("id", profile_id).execute()
    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    return row_to_response(result.data[0])


@router.delete("/{profile_id}")
async def delete_profile(profile_id: str):
    result = supabase.table("profiles").delete().eq("id", profile_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"deleted": True}
