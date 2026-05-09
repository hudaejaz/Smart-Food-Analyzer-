from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime, timezone

from app.database       import get_db
from app.utils.auth     import get_current_user
from app.models.meal_logs  import MealLog
from app.schemas.meal   import MealLogCreate, MealLogOut, DailySummaryOut

# /meals prefix — matches api.js calls to /meals/log, /meals/history, /meals/daily-summary
router = APIRouter(prefix="/meals", tags=["Meals"])


@router.post("/log", response_model=MealLogOut, status_code=201)
def log_meal(
    body: MealLogCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    meal = MealLog(
        **body.dict(),
        user_id=current_user.id
    )
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


@router.get("/history", response_model=List[MealLogOut])
def get_meal_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    meals = (
        db.query(MealLog)
        .filter(MealLog.user_id == current_user.id)
        .order_by(MealLog.logged_at.desc())
        .all()
    )
    return meals


@router.get("/daily-summary", response_model=DailySummaryOut)
def daily_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Use timezone-aware UTC midnight to match Supabase timestamps
    now_utc = datetime.now(timezone.utc)
    today_start = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)

    meals = (
        db.query(MealLog)
        .filter(
            MealLog.user_id == current_user.id,
            MealLog.logged_at >= today_start
        )
        .all()
    )
    return {
        "date":           str(date.today()),
        "total_calories": round(sum(m.calories  for m in meals), 1),
        "total_protein":  round(sum(m.protein_g for m in meals), 1),
        "total_carbs":    round(sum(m.carbs_g   for m in meals), 1),
        "total_fat":      round(sum(m.fat_g     for m in meals), 1),
        "meal_count":     len(meals)
    }
