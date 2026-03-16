from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Union


class Sensitivities(BaseModel):
    violence: int = Field(3, ge=1, le=5)
    blood_gore: int = Field(3, ge=1, le=5)
    self_harm: int = Field(3, ge=1, le=5)
    suicide: int = Field(3, ge=1, le=5)
    gun_weapon: int = Field(3, ge=1, le=5)
    abuse: int = Field(3, ge=1, le=5)
    death_grief: int = Field(3, ge=1, le=5)
    sexual_content: int = Field(3, ge=1, le=5)
    bullying: int = Field(3, ge=1, le=5)
    substance_use: int = Field(3, ge=1, le=5)
    flash_seizure: int = Field(3, ge=1, le=5)
    loud_sensory: int = Field(3, ge=1, le=5)


# Structured additional_details models
class ContentRule(BaseModel):
    category: str
    subtype: Optional[str] = None
    preference: Literal["allow", "warn_only", "blur", "mute", "auto_skip", "ask"] = "warn_only"
    intensity: Literal["mild", "moderate", "graphic", "all"] = "all"


class InteractionPreferences(BaseModel):
    warning_style: Literal["gentle", "neutral", "direct"] = "gentle"
    default_action_when_unsure: Literal["warn", "ask", "skip"] = "warn"
    show_scene_summary_after_skip: bool = True


class DailyCheckInPreferences(BaseModel):
    pre_watch_check_in: bool = False
    post_watch_check_in: bool = False
    allow_sensitive_day_toggle: bool = True


class AdditionalDetails(BaseModel):
    scale_benchmarks: Optional[dict] = Field(default_factory=lambda: {
        "1": "Very comfortable. Usually okay with this type of content and does not need warnings.",
        "2": "Mostly okay. May prefer a warning for stronger or more intense scenes.",
        "3": "Depends. Sometimes okay, sometimes not. A warning is helpful.",
        "4": "Sensitive. Often wants a warning, softer presentation, or the option to skip.",
        "5": "Very sensitive. Usually does not want this shown and may prefer automatic skipping or stronger filtering."
    })
    content_rules: List[ContentRule] = Field(default_factory=list)
    interaction_preferences: InteractionPreferences = Field(default_factory=InteractionPreferences)
    daily_check_in_preferences: DailyCheckInPreferences = Field(default_factory=DailyCheckInPreferences)
    notes: str = ""


class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=1, le=120)
    sensitivities: Sensitivities
    calming_strategy: str = Field("", max_length=500)
    additional_details: Union[AdditionalDetails, str, dict] = Field(default_factory=AdditionalDetails)


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=1, le=120)
    sensitivities: Optional[Sensitivities] = None
    calming_strategy: Optional[str] = Field(None, max_length=500)
    additional_details: Optional[Union[AdditionalDetails, str, dict]] = None


class ProfileResponse(BaseModel):
    id: str
    name: str
    age: int
    sensitivities: Sensitivities
    calming_strategy: str
    additional_details: Union[AdditionalDetails, str, dict]
    created_at: str
    updated_at: str
