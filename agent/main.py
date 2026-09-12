from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.apk import router as apk_router
from routers.automation import router as automation_router
from routers.console import router as console_router
from routers.devices import router as devices_router
from routers.health import router as health_router
from routers.reports import router as reports_router

app = FastAPI(title="Ultron ADB QA Agent", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(devices_router)
app.include_router(console_router)
app.include_router(apk_router)
app.include_router(automation_router)
app.include_router(reports_router)
