from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List

router = APIRouter()

class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)

class TaskOut(BaseModel):
    id: int
    title: str

_tasks: List[TaskOut] = []
_next_id: int = 1

def _find_index(task_id: int) -> int:
    for i, t in enumerate(_tasks):
        if t.id == task_id:
            return i
    return -1

@router.get("/health")
def health():
    return {"status": "ok"}

@router.get("/tasks", response_model=List[TaskOut])
def list_tasks():
    return _tasks

@router.post("/tasks", response_model=TaskOut, status_code=201)
def create_task(task: TaskIn):
    global _next_id
    item = TaskOut(id=_next_id, title=task.title)
    _tasks.append(item)
    _next_id += 1
    return item

@router.get("/tasks/{task_id}", response_model=TaskOut)
def get_task(task_id: int):
    idx = _find_index(task_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Not found")
    return _tasks[idx]

@router.put("/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, task: TaskIn):
    idx = _find_index(task_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Not found")
    updated = TaskOut(id=task_id, title=task.title)
    _tasks[idx] = updated
    return updated

@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    idx = _find_index(task_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Not found")
    _tasks.pop(idx)
    return None
