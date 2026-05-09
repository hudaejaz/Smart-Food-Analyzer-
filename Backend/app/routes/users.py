from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database      import get_db
from app.utils.auth    import get_current_user
from app.models.user_goals import UserGoals
from app.schemas.users import GoalsOut, GoalsUpdate

# /goals prefix — matches api.js calls to GET/PUT /goals
router = APIRouter(prefix="/goals", tags=["User Goals"])


@router.get("", response_model=GoalsOut)
def get_goals(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    goals = db.query(UserGoals).filter(UserGoals.user_id == current_user.id).first()
    if not goals:
        raise HTTPException(status_code=404, detail="Goals not found")
    return goals


@router.put("", response_model=GoalsOut)
def update_goals(
    body: GoalsUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    goals = db.query(UserGoals).filter(UserGoals.user_id == current_user.id).first()
    if not goals:
        raise HTTPException(status_code=404, detail="Goals record not found")
    for field, value in body.dict(exclude_unset=True).items():
        setattr(goals, field, value)
    db.commit()
    db.refresh(goals)
    return goals
